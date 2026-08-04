import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import Avatar from "../components/Avatar";
import "./AdminVerificationQueue.css";

const SIGNING_ENDPOINT = import.meta.env.VITE_ID_DOCUMENT_SIGNING_ENDPOINT;

const STATUS_LABELS = {
  pending_review: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
};

function statusBadgeClass(status) {
  if (status === "approved") return "vq-badge-approved";
  if (status === "rejected") return "vq-badge-rejected";
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setAdmin(user));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");

      try {
        const [docsSnap, profilesSnap] = await Promise.all([
          getDocs(collection(db, "identityDocuments")),
          getDocs(collection(db, "congoleseProfiles")),
        ]);

        if (cancelled) return;

        const byUid = {};
        profilesSnap.docs.forEach((p) => {
          byUid[p.data().userId] = { id: p.id, ...p.data() };
        });

        const docs = docsSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            const aTime = a.uploadedAt?.toMillis?.() || 0;
            const bTime = b.uploadedAt?.toMillis?.() || 0;
            return bTime - aTime;
          });

        setProfilesById(byUid);
        setDocuments(docs);
      } catch (err) {
        console.error("Failed to load verification queue:", err);
        if (!cancelled) setError("We couldn't load the verification queue right now. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 4000);
  };

  const filtered = documents.filter((d) => {
    const status = d.status || "pending_review";
    if (statusFilter !== "all" && status !== statusFilter) return false;
    return true;
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

  const review = async (document_, decision, rejectionReason = "") => {
    setBusyId(document_.id);
    setError("");

    const profile = profilesById[document_.userId];

    const reviewedAt = new Date();

    try {
      await updateDoc(doc(db, "identityDocuments", document_.id), {
        status: decision,
        reviewedBy: admin?.email || "",
        reviewedAt,
        rejectionReason: decision === "rejected" ? rejectionReason : "",
      });

      if (profile) {
        await updateDoc(doc(db, "congoleseProfiles", profile.id), {
          status: decision === "approved" ? "verified" : "rejected",
          rejectionReason: decision === "rejected" ? rejectionReason : "",
        });
      }

      await notifyApplicant(
        document_.email,
        decision === "approved"
          ? "Your identity verification was approved!"
          : `Your identity verification was rejected: ${rejectionReason}`,
        "/profile"
      );

      setDocuments((prev) =>
        prev.map((d) =>
          d.id === document_.id
            ? { ...d, status: decision, reviewedBy: admin?.email || "", reviewedAt, rejectionReason }
            : d
        )
      );

      showSuccess(`Document ${decision === "approved" ? "approved" : "rejected"}.`);
    } catch (err) {
      console.error("Failed to review document:", err);
      setError("Couldn't save this review. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const approve = (document_) => review(document_, "approved");

  const reject = (document_) => {
    const reason = window.prompt("Reason for rejecting this document?");
    if (reason === null) return;
    if (!reason.trim()) {
      setError("A rejection reason is required.");
      return;
    }
    if (!window.confirm("Reject this document? The applicant will be notified.")) return;
    review(document_, "rejected", reason.trim());
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
          <option value="pending_review">Pending Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
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

              return (
                <div className="vq-row" key={document_.id}>
                  <Avatar src={profile?.profileImageUrl} className="vq-row-avatar" alt={profile?.firstName} />

                  <div className="vq-row-body">
                    <div className="vq-row-title">
                      <strong>{profile ? `${profile.firstName} ${profile.lastName}` : document_.email}</strong>
                      <span className={`vq-badge ${statusBadgeClass(status)}`}>{STATUS_LABELS[status] || status}</span>
                    </div>
                    <p className="vq-row-meta">{document_.email} · {document_.fileName}</p>
                    <p className="vq-row-meta">Submitted {formatDate(document_.uploadedAt)}</p>
                    {document_.reviewedBy && (
                      <p className="vq-row-meta">
                        Reviewed by {document_.reviewedBy} on {formatDate(document_.reviewedAt)}
                      </p>
                    )}
                    {document_.rejectionReason && (
                      <p className="vq-row-meta vq-rejection-reason">Reason: {document_.rejectionReason}</p>
                    )}
                  </div>

                  <div className="vq-row-actions">
                    <button type="button" onClick={() => viewDocument(document_)} disabled={viewingId === document_.id}>
                      {viewingId === document_.id ? "Loading…" : "View Document"}
                    </button>

                    {status !== "approved" && (
                      <button type="button" onClick={() => approve(document_)} disabled={busyId === document_.id}>Approve</button>
                    )}

                    {status !== "rejected" && (
                      <button
                        type="button"
                        className="vq-reject-button"
                        onClick={() => reject(document_)}
                        disabled={busyId === document_.id}
                      >
                        Reject
                      </button>
                    )}
                  </div>
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
