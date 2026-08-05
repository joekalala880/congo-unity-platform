import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import Avatar from "../components/Avatar";
import VerificationBadge from "../components/identity/VerificationBadge";
import {
  DOCUMENT_TYPES_BY_SERVICE,
  SERVICE_TYPES,
  STATUS_LABELS,
  statusBadgeSuffix,
} from "../services/serviceApplicationTypes";
import { logApplicationAuditEvent } from "../services/serviceApplicationAuditService";
import "./AdminServiceApplicationDetail.css";

const SIGNING_ENDPOINT = import.meta.env.VITE_ID_DOCUMENT_SIGNING_ENDPOINT;

function formatDateTime(value) {
  if (!value) return "—";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

const AUDIT_TYPE_LABELS = {
  creation: "Application started",
  submission: "Submitted for review",
  review_started: "Marked under review",
  approval: "Approved",
  rejection: "Rejected",
  request_more_info: "More information requested",
  withdrawal: "Withdrawn",
};

function AdminServiceApplicationDetail() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [application, setApplication] = useState(null);
  const [profile, setProfile] = useState(null);
  const [auditEvents, setAuditEvents] = useState([]);
  const [notes, setNotes] = useState([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setAdmin(user));
    return () => unsubscribe();
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const appSnap = await getDoc(doc(db, "serviceApplications", applicationId));
      if (!appSnap.exists()) {
        setApplication(null);
        return;
      }
      const app = { id: appSnap.id, ...appSnap.data() };
      setApplication(app);

      const profileSnap = await getDocs(
        query(collection(db, "congoleseProfiles"), where("userId", "==", app.applicantUserId))
      );
      if (!profileSnap.empty) {
        setProfile({ id: profileSnap.docs[0].id, ...profileSnap.docs[0].data() });
      }

      const [auditSnap, notesSnap] = await Promise.all([
        getDocs(query(collection(db, "serviceApplicationAuditLogs"), where("applicationId", "==", applicationId))),
        getDocs(collection(db, "serviceApplications", applicationId, "reviewNotes")),
      ]);

      setAuditEvents(
        auditSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
      );
      setNotes(
        notesSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0))
      );
    } catch (err) {
      console.error("Failed to load application:", err);
      setError("We couldn't load this application. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    (async () => {
      await loadAll();
    })();
  }, [loadAll]);

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 4000);
  };

  const notifyApplicant = async (message) => {
    if (!application) return;
    try {
      await addDoc(collection(db, "notifications"), {
        to: application.applicantEmail,
        from: "Congo Unity Admin",
        type: "Government Service Application",
        message,
        relatedRoute: `/government/applications/${application.id}`,
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Failed to create notification:", err);
    }
  };

  const applyDecision = async ({ status, extraFields = {}, auditType, auditMessage, notifyMessage }) => {
    setBusy(true);
    setError("");

    try {
      await updateDoc(doc(db, "serviceApplications", applicationId), {
        status,
        reviewerId: admin.uid,
        reviewedBy: admin.email || "",
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...extraFields,
      });

      await logApplicationAuditEvent({
        type: auditType,
        applicationId,
        userId: application.applicantUserId,
        actorId: admin.uid,
        actorRole: "admin",
        message: auditMessage,
      });

      if (notifyMessage) await notifyApplicant(notifyMessage);

      showSuccess("Review saved.");
      await loadAll();
    } catch (err) {
      console.error("Failed to save review:", err);
      setError("Couldn't save this review. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const markUnderReview = () =>
    applyDecision({
      status: "under_review",
      auditType: "review_started",
      auditMessage: "Marked under review.",
    });

  const approve = () =>
    applyDecision({
      status: "approved",
      extraFields: { rejectionReason: "", requestMoreInfoMessage: "" },
      auditType: "approval",
      auditMessage: "Approved.",
      notifyMessage: `Your ${(SERVICE_TYPES[application?.serviceType]?.label || "application").toLowerCase()} was approved.`,
    });

  const reject = () => {
    const reason = window.prompt("Reason for rejecting this application? (required)");
    if (reason === null) return;
    if (!reason.trim()) {
      setError("A rejection reason is required.");
      return;
    }
    if (!window.confirm("Reject this application? The applicant will be notified.")) return;

    applyDecision({
      status: "rejected",
      extraFields: { rejectionReason: reason.trim(), requestMoreInfoMessage: "" },
      auditType: "rejection",
      auditMessage: `Rejected: ${reason.trim()}`,
      notifyMessage: `Your ${(SERVICE_TYPES[application?.serviceType]?.label || "application").toLowerCase()} was rejected: ${reason.trim()}`,
    });
  };

  const requestMoreInfo = () => {
    const message = window.prompt("What additional information is needed? (required)");
    if (message === null) return;
    if (!message.trim()) {
      setError("A message is required to request more information.");
      return;
    }

    applyDecision({
      status: "more_information_required",
      extraFields: { requestMoreInfoMessage: message.trim(), rejectionReason: "" },
      auditType: "request_more_info",
      auditMessage: `Requested more information: ${message.trim()}`,
      notifyMessage: `We need more information about your ${(SERVICE_TYPES[application?.serviceType]?.label || "application").toLowerCase()}: ${message.trim()}`,
    });
  };

  const viewDocument = async (docItem) => {
    if (!SIGNING_ENDPOINT) {
      setError("Document viewing isn't configured yet — the signing endpoint hasn't been deployed.");
      return;
    }

    setViewingDoc(docItem.cloudinaryPublicId);
    setError("");

    try {
      const idToken = await admin.getIdToken();
      const response = await fetch(SIGNING_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          action: "view",
          publicId: docItem.cloudinaryPublicId,
          resourceType: docItem.resourceType || "image",
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
      setViewingDoc(null);
    }
  };

  const addNote = async () => {
    if (!noteDraft.trim() || !admin) return;

    try {
      await addDoc(collection(db, "serviceApplications", applicationId, "reviewNotes"), {
        authorId: admin.uid,
        authorEmail: admin.email || "",
        message: noteDraft.trim(),
        createdAt: serverTimestamp(),
      });
      setNoteDraft("");
      await loadAll();
    } catch (err) {
      console.error("Failed to add note:", err);
      setError("Couldn't save this note. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="admdet-page">
        <p className="admdet-loading">Loading…</p>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="admdet-page">
        <p className="admdet-loading">Application not found.</p>
      </div>
    );
  }

  return (
    <div className="admdet-page">
      <button type="button" className="admdet-back" onClick={() => navigate("/admin/service-applications")}>
        ← Back to Applications
      </button>

      <div className="admdet-header">
        <Avatar src={profile?.profileImageUrl} className="admdet-avatar" alt={application.applicantFullName} />
        <div>
          <h1>{application.applicantFullName}</h1>
          <p>{SERVICE_TYPES[application.serviceType]?.label || application.serviceType} · {application.citizenId || "—"}</p>
          {profile && <VerificationBadge status={profile.status} />}
        </div>
        <span className={`admdet-badge admdet-badge-${statusBadgeSuffix(application.status)}`}>
          {STATUS_LABELS[application.status] || application.status}
        </span>
      </div>

      {successMessage && <p className="register-form__success" role="status">{successMessage}</p>}
      {error && <p className="register-form__error" role="alert">{error}</p>}

      <div className="admdet-grid">
        <div className="admdet-card">
          <h4>Application Details</h4>
          <dl className="admdet-fields">
            <div><dt>Date of Birth</dt><dd>{application.dateOfBirth || "—"}</dd></div>
            <div><dt>Place of Birth</dt><dd>{application.placeOfBirth || "—"}</dd></div>
            {application.serviceType === "birth_certificate" && (
              <>
                <div><dt>Province of Birth</dt><dd>{application.provinceOfBirth || "—"}</dd></div>
                <div><dt>Territory of Birth</dt><dd>{application.territoryOfBirth || "—"}</dd></div>
                <div><dt>Father's Name</dt><dd>{application.fatherFullName || "—"}</dd></div>
                <div><dt>Mother's Name</dt><dd>{application.motherFullName || "—"}</dd></div>
                <div><dt>Delivery</dt><dd>{application.deliveryPreference || "—"}</dd></div>
              </>
            )}
            {application.serviceType === "passport" && (
              <>
                <div><dt>Passport Type</dt><dd>{application.passportType || "—"}</dd></div>
                <div><dt>Application Mode</dt><dd>{application.applicationMode || "—"}</dd></div>
                {application.applicationMode === "renewal" && (
                  <>
                    <div><dt>Current Passport #</dt><dd>{application.currentPassportNumber || "—"}</dd></div>
                    <div><dt>Issue Date</dt><dd>{application.currentPassportIssueDate || "—"}</dd></div>
                    <div><dt>Expiration Date</dt><dd>{application.currentPassportExpirationDate || "—"}</dd></div>
                  </>
                )}
                <div><dt>Emergency Contact</dt><dd>{application.emergencyContactName || "—"} {application.emergencyContactPhone ? `(${application.emergencyContactPhone})` : ""}</dd></div>
              </>
            )}
            <div><dt>Reason</dt><dd>{application.reasonForRequest || "—"}</dd></div>
            <div><dt>Member Number</dt><dd>{application.memberNumber || "—"}</dd></div>
            <div><dt>Submitted</dt><dd>{formatDateTime(application.submittedAt)}</dd></div>
          </dl>

          {application.rejectionReason && (
            <p className="admdet-note-line admdet-note-rejected">Rejection reason: {application.rejectionReason}</p>
          )}
          {application.requestMoreInfoMessage && (
            <p className="admdet-note-line admdet-note-info">Requested info: {application.requestMoreInfoMessage}</p>
          )}
        </div>

        <div className="admdet-card">
          <h4>Supporting Documents</h4>
          {(application.supportingDocuments || []).length === 0 ? (
            <p className="admdet-empty">None uploaded.</p>
          ) : (
            application.supportingDocuments.map((d) => (
              <div className="admdet-doc-row" key={d.cloudinaryPublicId}>
                <span>{(DOCUMENT_TYPES_BY_SERVICE[application.serviceType] || []).find((t) => t.value === d.documentType)?.label || d.documentType}</span>
                <button type="button" onClick={() => viewDocument(d)} disabled={viewingDoc === d.cloudinaryPublicId}>
                  {viewingDoc === d.cloudinaryPublicId ? "Loading…" : "View"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="admdet-actions">
        {application.status === "submitted" && (
          <button type="button" onClick={markUnderReview} disabled={busy}>Mark Under Review</button>
        )}
        {application.status !== "approved" && (
          <button type="button" onClick={approve} disabled={busy}>Approve</button>
        )}
        {application.status !== "rejected" && (
          <button type="button" className="admdet-reject-button" onClick={reject} disabled={busy}>Reject</button>
        )}
        <button type="button" onClick={requestMoreInfo} disabled={busy}>Request More Info</button>
      </div>

      <div className="admdet-card">
        <h4>Internal Review Notes</h4>
        {notes.length === 0 ? (
          <p className="admdet-empty">No notes yet.</p>
        ) : (
          notes.map((note) => (
            <p key={note.id} className="admdet-note-line">
              {formatDateTime(note.createdAt)} — {note.authorEmail}: {note.message}
            </p>
          ))
        )}
        <div className="admdet-note-form">
          <textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder="Add an internal note (not visible to the applicant)…"
            aria-label="Add internal review note"
          />
          <button type="button" onClick={addNote}>Add Note</button>
        </div>
      </div>

      <div className="admdet-card">
        <h4>Audit History</h4>
        {auditEvents.length === 0 ? (
          <p className="admdet-empty">No activity yet.</p>
        ) : (
          auditEvents.map((event) => (
            <p key={event.id} className="admdet-note-line">
              {formatDateTime(event.createdAt)} — [{event.actorRole}] {AUDIT_TYPE_LABELS[event.type] || event.type}: {event.message}
            </p>
          ))
        )}
      </div>
    </div>
  );
}

export default AdminServiceApplicationDetail;
