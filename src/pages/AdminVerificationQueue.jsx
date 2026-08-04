import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import Avatar from "../components/Avatar";
import { DOCUMENT_TYPE_LABELS, STATUS_LABELS } from "../services/identityDocumentTypes";
import { listMyDocuments } from "../services/identityDocumentsService";
import { logAuditEvent } from "../services/verificationAuditService";
import { maybeFinalizeVerification } from "../services/verificationService";
import "./AdminVerificationQueue.css";

const SIGNING_ENDPOINT = import.meta.env.VITE_ID_DOCUMENT_SIGNING_ENDPOINT;

// Legacy documents (uploaded via the old UploadID.jsx flow, before Phase 2)
// have no documentType/citizenId and use the old pending_review/approved/
// rejected status vocabulary. Displayed read-only-ish (still admin-writable
// since firestore.rules never restricted admin writes by schema) rather
// than migrated — matches the lazy-backfill approach used elsewhere.
function isLegacyDocument(docItem) {
  return !docItem.documentType;
}

const LEGACY_STATUS_LABELS = {
  pending_review: "Pending Review (legacy)",
  approved: "Approved",
  rejected: "Rejected",
};

function statusBadgeClass(status) {
  if (status === "approved") return "vq-badge-approved";
  if (status === "rejected") return "vq-badge-rejected";
  if (status === "under_review") return "vq-badge-review";
  if (status === "more_information_required") return "vq-badge-info";
  if (status === "replaced") return "vq-badge-replaced";
  return "vq-badge-pending";
}

function formatDate(value) {
  if (!value) return "—";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function RowSkeleton() {
  return (
    <div className="vq-row">
      <div className="vq-skeleton vq-skeleton-avatar" />
      <div className="vq-row-body">
        <div className="vq-skeleton vq-skeleton-line" style={{ width: "40%" }} />
        <div className="vq-skeleton vq-skeleton-line" style={{ width: "65%" }} />
      </div>
    </div>
  );
}

function AdminVerificationQueue() {
  const [admin, setAdmin] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [profilesById, setProfilesById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");
  const [busyId, setBusyId] = useState(null);
  const [viewingId, setViewingId] = useState(null);

  const [expandedId, setExpandedId] = useState(null);
  const [historyById, setHistoryById] = useState({});
  const [noteDraft, setNoteDraft] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setAdmin(user));
    return () => unsubscribe();
  }, []);

  const loadQueue = async () => {
    setLoading(true);
    setError("");

    try {
      const [docsSnap, profilesSnap] = await Promise.all([
        getDocs(collection(db, "identityDocuments")),
        getDocs(collection(db, "congoleseProfiles")),
      ]);

      const byUid = {};
      profilesSnap.docs.forEach((p) => {
        byUid[p.data().userId] = { id: p.id, ...p.data() };
      });

      const docs = docsSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        // Drafts are private, unsubmitted work — nothing for an admin to do.
        .filter((d) => d.status !== "draft")
        .sort((a, b) => {
          const aTime = a.submittedAt?.toMillis?.() || a.uploadedAt?.toMillis?.() || 0;
          const bTime = b.submittedAt?.toMillis?.() || b.uploadedAt?.toMillis?.() || 0;
          return bTime - aTime;
        });

      setProfilesById(byUid);
      setDocuments(docs);
    } catch (err) {
      console.error("Failed to load verification queue:", err);
      setError("We couldn't load the verification queue right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await loadQueue();
    })();
  }, []);

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 4000);
  };

  const filtered = documents.filter((d) => {
    const status = d.status || "pending_review";
    if (statusFilter === "all") return true;
    return status === statusFilter;
  });

  const notifyApplicant = async (applicantEmail, message, relatedRoute) => {
    try {
      await addDoc(collection(db, "notifications"), {
        to: applicantEmail,
        from: "Congo Unity Admin",
        type: "Identity Verification",
        message,
        relatedRoute,
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      // Notification failure shouldn't block the review action itself —
      // the document/profile status is already correctly updated.
      console.error("Failed to create notification:", err);
    }
  };

  const applyDecision = async (document_, { status, reviewFields = {}, auditType, auditMessage, notifyMessage }) => {
    setBusyId(document_.id);
    setError("");

    const profile = profilesById[document_.userId];
    const reviewedAt = new Date();

    try {
      await updateDoc(doc(db, "identityDocuments", document_.id), {
        status,
        reviewerId: admin.uid,
        reviewedBy: admin.email || "",
        reviewedAt,
        ...reviewFields,
      });

      await logAuditEvent({
        type: auditType,
        documentId: document_.id,
        userId: document_.userId,
        actorId: admin.uid,
        actorRole: "admin",
        message: auditMessage,
      });

      if (notifyMessage && (document_.email || profile?.email)) {
        await notifyApplicant(document_.email || profile.email, notifyMessage, "/identity/documents");
      }

      setDocuments((prev) =>
        prev.map((d) => (d.id === document_.id ? { ...d, status, reviewerId: admin.uid, reviewedBy: admin.email || "", reviewedAt, ...reviewFields } : d))
      );

      // Only a real, current-schema approval can complete a full
      // verification — legacy documents and non-approval decisions never
      // trigger this.
      if (status === "approved" && profile && !isLegacyDocument(document_)) {
        const freshDocs = await listMyDocuments(document_.userId);
        const verified = await maybeFinalizeVerification({ admin, profile, documents: freshDocs });
        if (verified) {
          await notifyApplicant(
            profile.email,
            "Congratulations — your Congo Unity identity has been fully verified!",
            "/profile"
          );
          showSuccess("Document approved. All required documents are now verified — profile marked Verified.");
          setBusyId(null);
          return;
        }
      }

      showSuccess("Review saved.");
    } catch (err) {
      console.error("Failed to review document:", err);
      setError("Couldn't save this review. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const markUnderReview = (document_) =>
    applyDecision(document_, {
      status: "under_review",
      auditType: "review_started",
      auditMessage: `Marked ${DOCUMENT_TYPE_LABELS[document_.documentType] || "document"} under review.`,
    });

  const approve = (document_) =>
    applyDecision(document_, {
      status: "approved",
      reviewFields: { rejectionReason: "", requestMoreInfoMessage: "" },
      auditType: "approval",
      auditMessage: `Approved ${DOCUMENT_TYPE_LABELS[document_.documentType] || "document"}.`,
      notifyMessage: `Your ${DOCUMENT_TYPE_LABELS[document_.documentType] || "document"} was approved.`,
    });

  const reject = (document_) => {
    const reason = window.prompt("Reason for rejecting this document? (required)");
    if (reason === null) return;
    if (!reason.trim()) {
      setError("A rejection reason is required.");
      return;
    }
    if (!window.confirm("Reject this document? The applicant will be notified.")) return;

    applyDecision(document_, {
      status: "rejected",
      reviewFields: { rejectionReason: reason.trim(), requestMoreInfoMessage: "" },
      auditType: "rejection",
      auditMessage: `Rejected ${DOCUMENT_TYPE_LABELS[document_.documentType] || "document"}: ${reason.trim()}`,
      notifyMessage: `Your ${DOCUMENT_TYPE_LABELS[document_.documentType] || "document"} was rejected: ${reason.trim()}`,
    });
  };

  const requestMoreInfo = (document_) => {
    const message = window.prompt("What additional information is needed? (required)");
    if (message === null) return;
    if (!message.trim()) {
      setError("A message is required to request more information.");
      return;
    }

    applyDecision(document_, {
      status: "more_information_required",
      reviewFields: { requestMoreInfoMessage: message.trim(), rejectionReason: "" },
      auditType: "request_more_info",
      auditMessage: `Requested more information for ${DOCUMENT_TYPE_LABELS[document_.documentType] || "document"}: ${message.trim()}`,
      notifyMessage: `We need more information about your ${DOCUMENT_TYPE_LABELS[document_.documentType] || "document"}: ${message.trim()}`,
    });
  };

  const suspendVerification = async (document_) => {
    const profile = profilesById[document_.userId];
    if (!profile) return;

    if (profile.userId === admin?.uid) {
      setError("You can't suspend your own verification.");
      return;
    }

    if (!window.confirm(`Suspend ${profile.firstName || profile.email}'s verification? Their account will be marked suspended.`)) {
      return;
    }

    setBusyId(document_.id);
    setError("");

    try {
      await updateDoc(doc(db, "congoleseProfiles", profile.id), {
        status: "suspended",
        previousStatus: profile.status || "pending_verification",
      });

      await logAuditEvent({
        type: "profile_verification_change",
        documentId: document_.id,
        userId: document_.userId,
        actorId: admin.uid,
        actorRole: "admin",
        message: "Verification suspended by admin.",
      });

      await notifyApplicant(profile.email, "Your Congo Unity verification has been suspended.", "/profile");

      setProfilesById((prev) => ({
        ...prev,
        [document_.userId]: { ...profile, status: "suspended", previousStatus: profile.status },
      }));

      showSuccess("Verification suspended.");
    } catch (err) {
      console.error("Failed to suspend verification:", err);
      setError("Couldn't suspend this verification. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const viewDocument = async (document_) => {
    if (!SIGNING_ENDPOINT) {
      setError("Document viewing isn't configured yet — the signing endpoint hasn't been deployed. See README.");
      return;
    }

    setViewingId(document_.id);
    setError("");

    try {
      const idToken = await admin.getIdToken();
      const response = await fetch(SIGNING_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          action: "view",
          publicId: document_.cloudinaryPublicId,
          resourceType: document_.resourceType || "image",
        }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.error || "Could not get a viewing link for this document.");
      }

      window.open(body.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Failed to view document:", err);
      setError(err?.message || "Could not open this document. Please try again.");
    } finally {
      setViewingId(null);
    }
  };

  const toggleHistory = async (document_) => {
    if (expandedId === document_.id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(document_.id);
    setNoteDraft("");

    if (historyById[document_.id]) return;

    try {
      const [notesSnap, auditSnap] = await Promise.all([
        getDocs(collection(db, "identityDocuments", document_.id, "reviewNotes")),
        getDocs(query(collection(db, "verificationAuditLogs"), where("documentId", "==", document_.id))),
      ]);

      const notes = notesSnap.docs
        .map((n) => ({ id: n.id, ...n.data() }))
        .sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0));

      const audit = auditSnap.docs
        .map((a) => ({ id: a.id, ...a.data() }))
        .sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0));

      setHistoryById((prev) => ({ ...prev, [document_.id]: { notes, audit } }));
    } catch (err) {
      console.error("Failed to load document history:", err);
    }
  };

  const addNote = async (document_) => {
    if (!noteDraft.trim()) return;

    try {
      await addDoc(collection(db, "identityDocuments", document_.id, "reviewNotes"), {
        authorId: admin.uid,
        authorEmail: admin.email || "",
        message: noteDraft.trim(),
        createdAt: serverTimestamp(),
      });

      const notesSnap = await getDocs(collection(db, "identityDocuments", document_.id, "reviewNotes"));
      const notes = notesSnap.docs
        .map((n) => ({ id: n.id, ...n.data() }))
        .sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0));

      setHistoryById((prev) => ({ ...prev, [document_.id]: { ...prev[document_.id], notes } }));
      setNoteDraft("");
    } catch (err) {
      console.error("Failed to add review note:", err);
      setError("Couldn't save this note. Please try again.");
    }
  };

  return (
    <div className="vq-page">
      <div className="vq-header">
        <h1>Verification Queue</h1>
        <p>Review submitted identity documents.</p>
      </div>

      {successMessage && <p className="register-form__success" role="status">{successMessage}</p>}
      {error && <p className="register-form__error" role="alert">{error}</p>}

      <div className="vq-filters">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by review status">
          <option value="all">All statuses</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under Review</option>
          <option value="more_information_required">More Info Required</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="replaced">Replaced</option>
          <option value="pending_review">Pending Review (legacy)</option>
        </select>
      </div>

      {loading ? (
        <div className="vq-list">
          <RowSkeleton />
          <RowSkeleton />
        </div>
      ) : filtered.length === 0 ? (
        <div className="vq-empty">
          <p>No submissions match your filters.</p>
        </div>
      ) : (
        <>
          <p className="vq-count">{filtered.length} submission{filtered.length === 1 ? "" : "s"}</p>

          <div className="vq-list">
            {filtered.map((document_) => {
              const status = document_.status || "pending_review";
              const profile = profilesById[document_.userId];
              const legacy = isLegacyDocument(document_);
              const history = historyById[document_.id];

              return (
                <div className="vq-row-wrap" key={document_.id}>
                  <div className="vq-row">
                    <Avatar src={profile?.profileImageUrl} className="vq-row-avatar" alt={profile?.firstName} />

                    <div className="vq-row-body">
                      <div className="vq-row-title">
                        <strong>{profile ? `${profile.firstName} ${profile.lastName}` : document_.email}</strong>
                        <span className={`vq-badge ${statusBadgeClass(legacy && status === "pending_review" ? "submitted" : status)}`}>
                          {legacy ? (LEGACY_STATUS_LABELS[status] || status) : (STATUS_LABELS[status] || status)}
                        </span>
                        {legacy && <span className="vq-badge vq-badge-legacy">Legacy</span>}
                      </div>

                      <p className="vq-row-meta">
                        {legacy ? document_.fileName : (DOCUMENT_TYPE_LABELS[document_.documentType] || document_.documentType)}
                        {profile?.citizenId && ` · ${profile.citizenId}`}
                        {profile?.memberNumber && ` · ${profile.memberNumber}`}
                      </p>
                      <p className="vq-row-meta">
                        Submitted {formatDate(document_.submittedAt || document_.uploadedAt)}
                        {document_.expirationDate && ` · Expires ${document_.expirationDate}`}
                      </p>
                      {(document_.reviewedBy || document_.reviewerId) && (
                        <p className="vq-row-meta">
                          Reviewed by {document_.reviewedBy || document_.reviewerId} on {formatDate(document_.reviewedAt)}
                        </p>
                      )}
                      {document_.rejectionReason && (
                        <p className="vq-row-meta vq-rejection-reason">Rejection reason: {document_.rejectionReason}</p>
                      )}
                      {document_.requestMoreInfoMessage && (
                        <p className="vq-row-meta vq-rejection-reason">Requested info: {document_.requestMoreInfoMessage}</p>
                      )}
                      {document_.ownerResponseMessage && (
                        <p className="vq-row-meta">Applicant response: {document_.ownerResponseMessage}</p>
                      )}
                    </div>

                    <div className="vq-row-actions">
                      <button type="button" onClick={() => viewDocument(document_)} disabled={viewingId === document_.id}>
                        {viewingId === document_.id ? "Loading…" : "View Document"}
                      </button>

                      {!legacy && status === "submitted" && (
                        <button type="button" onClick={() => markUnderReview(document_)} disabled={busyId === document_.id}>
                          Mark Under Review
                        </button>
                      )}

                      {status !== "approved" && (
                        <button type="button" onClick={() => approve(document_)} disabled={busyId === document_.id}>Approve</button>
                      )}

                      {status !== "rejected" && (
                        <button type="button" className="vq-reject-button" onClick={() => reject(document_)} disabled={busyId === document_.id}>
                          Reject
                        </button>
                      )}

                      {!legacy && (
                        <button type="button" onClick={() => requestMoreInfo(document_)} disabled={busyId === document_.id}>
                          Request More Info
                        </button>
                      )}

                      <button type="button" className="vq-reject-button" onClick={() => suspendVerification(document_)} disabled={busyId === document_.id}>
                        Suspend Verification
                      </button>

                      <button type="button" onClick={() => toggleHistory(document_)}>
                        {expandedId === document_.id ? "Hide Notes & History" : "Notes & History"}
                      </button>
                    </div>
                  </div>

                  {expandedId === document_.id && (
                    <div className="vq-history">
                      <h4>Audit History</h4>
                      {!history?.audit?.length && <p className="vq-row-meta">No audit events yet.</p>}
                      {history?.audit?.map((event) => (
                        <p key={event.id} className="vq-row-meta">
                          {formatDate(event.createdAt)} — [{event.actorRole}] {event.type}: {event.message}
                        </p>
                      ))}

                      <h4>Internal Review Notes</h4>
                      {!history?.notes?.length && <p className="vq-row-meta">No notes yet.</p>}
                      {history?.notes?.map((note) => (
                        <p key={note.id} className="vq-row-meta">
                          {formatDate(note.createdAt)} — {note.authorEmail}: {note.message}
                        </p>
                      ))}

                      <div className="vq-note-form">
                        <textarea
                          value={noteDraft}
                          onChange={(e) => setNoteDraft(e.target.value)}
                          placeholder="Add an internal note (not visible to the applicant)…"
                          aria-label="Add internal review note"
                        />
                        <button type="button" onClick={() => addNote(document_)}>Add Note</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default AdminVerificationQueue;
