import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../firebase";
import { getApplication, withdrawApplication } from "../services/serviceApplicationsService";
import {
  DOCUMENT_TYPES_BY_SERVICE,
  SERVICE_TYPES,
  STATUS_LABELS,
  statusBadgeSuffix,
} from "../services/serviceApplicationTypes";
import "./GovernmentApplicationDetail.css";

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

function GovernmentApplicationDetail() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [application, setApplication] = useState(null);
  const [auditEvents, setAuditEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const app = await getApplication(applicationId);
        setApplication(app);

        const auditSnap = await getDocs(
          query(collection(db, "serviceApplicationAuditLogs"), where("applicationId", "==", applicationId))
        );
        const events = auditSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        setAuditEvents(events);
      } catch (err) {
        console.error("Failed to load application:", err);
        setError("We couldn't load this application. Please try again.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [applicationId]);

  const handleWithdraw = async () => {
    if (!window.confirm("Withdraw this application? This can't be undone.")) return;

    setBusy(true);
    setError("");

    try {
      await withdrawApplication(user, applicationId);
      setApplication((prev) => ({ ...prev, status: "withdrawn" }));
    } catch (err) {
      console.error("Failed to withdraw application:", err);
      setError("Couldn't withdraw this application. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <section className="register-section">
        <p className="govdet-loading">Loading…</p>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="register-section">
        <p className="govdet-loading">Please log in to view this application.</p>
      </section>
    );
  }

  if (!application || application.applicantUserId !== user.uid) {
    return (
      <section className="register-section">
        <div className="govdet-card">
          <h3>Application not found</h3>
          <p>This application doesn't exist or isn't yours.</p>
        </div>
      </section>
    );
  }

  const canWithdraw = application.status === "draft" || application.status === "submitted";
  const serviceInfo = SERVICE_TYPES[application.serviceType];
  const documentTypes = DOCUMENT_TYPES_BY_SERVICE[application.serviceType] || [];

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>{serviceInfo?.label || "Application"}</h1>
        <p>Congo Unity Platform request — track your application status below.</p>
      </div>

      {error && <p className="register-form__error" role="alert">{error}</p>}

      <div className="govdet-card">
        <div className="govdet-title">
          <strong>{application.applicantFullName}</strong>
          <span className={`govdet-badge govdet-badge-${statusBadgeSuffix(application.status)}`}>
            {STATUS_LABELS[application.status] || application.status}
          </span>
        </div>

        <p className="govdet-meta">Last updated {formatDateTime(application.updatedAt)}</p>

        {application.status === "rejected" && application.rejectionReason && (
          <p className="govdet-reason">Rejection reason: {application.rejectionReason}</p>
        )}

        {application.status === "more_information_required" && application.requestMoreInfoMessage && (
          <div className="govdet-info-request">
            <p>Admin requested: {application.requestMoreInfoMessage}</p>
            <Link to={`/government/services/${serviceInfo?.route || ""}`}>
              <button type="button">Respond & Resubmit</button>
            </Link>
          </div>
        )}

        <div className="govdet-docs">
          <h4>Supporting Documents</h4>
          {(application.supportingDocuments || []).length === 0 ? (
            <p className="govdet-empty">None uploaded.</p>
          ) : (
            application.supportingDocuments.map((d) => (
              <p key={d.cloudinaryPublicId} className="govdet-doc-row">
                {documentTypes.find((t) => t.value === d.documentType)?.label || d.documentType}
              </p>
            ))
          )}
        </div>

        {canWithdraw && (
          <button type="button" className="govdet-withdraw" onClick={handleWithdraw} disabled={busy}>
            {busy ? "Withdrawing…" : "Withdraw Application"}
          </button>
        )}
      </div>

      <div className="govdet-timeline">
        <h4>Timeline</h4>
        {auditEvents.length === 0 ? (
          <p className="govdet-empty">No activity yet.</p>
        ) : (
          auditEvents.map((event) => (
            <div className="govdet-timeline-item" key={event.id}>
              <p>{AUDIT_TYPE_LABELS[event.type] || event.type}</p>
              <span>{formatDateTime(event.createdAt)}</span>
            </div>
          ))
        )}
      </div>

      <div className="govdet-back">
        <button type="button" onClick={() => navigate("/government/applications")}>Back to My Applications</button>
      </div>
    </section>
  );
}

export default GovernmentApplicationDetail;
