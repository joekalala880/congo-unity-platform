import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../firebase";
import { listMyDocuments } from "../services/identityDocumentsService";
import { DOCUMENT_TYPE_LABELS, PRIMARY_ID_TYPES } from "../services/identityDocumentTypes";
import { logAuditEvent } from "../services/verificationAuditService";
import { computeProfileCompletion } from "../services/profileCompletion";
import DigitalIdentityCard from "../components/identity/DigitalIdentityCard";
import VerificationBadge from "../components/identity/VerificationBadge";
import "./IdentityDashboard.css";

function formatDateTime(value) {
  if (!value) return "—";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

const AUDIT_TYPE_LABELS = {
  upload: "Document uploaded",
  submission: "Document submitted for review",
  review_started: "Marked under review",
  approval: "Document approved",
  rejection: "Document rejected",
  request_more_info: "More information requested",
  document_replacement: "Document replaced",
  deletion: "Draft deleted",
  profile_verification_change: "Verification status changed",
  card_reissued: "Digital ID card downloaded/printed",
};

function daysUntil(dateString) {
  if (!dateString) return null;
  const target = new Date(dateString);
  if (Number.isNaN(target.getTime())) return null;
  return Math.ceil((target.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function IdentityDashboard() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [profile, setProfile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [auditEvents, setAuditEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const cardSectionRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthChecked(true);

      if (!currentUser) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const profileSnap = await getDocs(
          query(collection(db, "congoleseProfiles"), where("email", "==", currentUser.email))
        );

        if (!profileSnap.empty) {
          setProfile({ id: profileSnap.docs[0].id, ...profileSnap.docs[0].data() });
        }

        const docs = await listMyDocuments(currentUser.uid);
        setDocuments(docs);

        const auditSnap = await getDocs(
          query(collection(db, "verificationAuditLogs"), where("userId", "==", currentUser.uid))
        );
        const events = auditSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
          .slice(0, 10);
        setAuditEvents(events);
      } catch (err) {
        console.error("Failed to load identity dashboard:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleReissue = () => {
    if (!user || !profile) return;
    logAuditEvent({
      type: "card_reissued",
      documentId: null,
      userId: user.uid,
      actorId: user.uid,
      actorRole: "citizen",
      message: "Digital ID card downloaded or printed.",
    });
  };

  const scrollToCard = () => {
    cardSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (authChecked && !user) {
    return (
      <div className="iddash-page">
        <div className="iddash-signed-out">
          <h1>Identity Dashboard</h1>
          <p>Please <Link to="/login">log in</Link> to view your Congo Unity identity.</p>
        </div>
      </div>
    );
  }

  const completion = computeProfileCompletion(profile);
  const approvedDocs = documents.filter((d) => d.status === "approved");
  const rejectedDocs = documents.filter((d) => d.status === "rejected");
  const moreInfoDocs = documents.filter((d) => d.status === "more_information_required");

  const hasPrimaryId = approvedDocs.some((d) => PRIMARY_ID_TYPES.includes(d.documentType));
  const hasSelfie = approvedDocs.some((d) => d.documentType === "selfie");
  const requiredCount = (hasPrimaryId ? 1 : 0) + (hasSelfie ? 1 : 0);

  const expiringSoon = documents.filter((d) => {
    if (d.status !== "approved" || !d.expirationDate) return false;
    const days = daysUntil(d.expirationDate);
    return days !== null && days <= 30;
  });

  const securityAlerts = [];
  if (profile?.status === "suspended") {
    securityAlerts.push({ id: "suspended", text: "Your account is suspended. Contact an administrator for help." });
  }
  if (moreInfoDocs.length > 0) {
    securityAlerts.push({
      id: "more-info",
      text: `${moreInfoDocs.length} document${moreInfoDocs.length === 1 ? "" : "s"} awaiting your response.`,
    });
  }
  expiringSoon.forEach((d) => {
    securityAlerts.push({
      id: `expiring-${d.id}`,
      text: `Your ${DOCUMENT_TYPE_LABELS[d.documentType] || d.documentType} expires ${d.expirationDate}.`,
    });
  });

  return (
    <div className="iddash-page">
      <div className="iddash-header">
        <div>
          <h1>Identity Dashboard</h1>
          <p>Your Congo Unity national identity, verification progress, and Digital ID card.</p>
        </div>
        {profile && <VerificationBadge status={profile.status} />}
      </div>

      {securityAlerts.length > 0 && (
        <div className="iddash-alerts">
          {securityAlerts.map((alert) => (
            <p key={alert.id} className="iddash-alert">⚠ {alert.text}</p>
          ))}
        </div>
      )}

      <section className="iddash-section">
        <div className="iddash-stat-grid">
          <div className="iddash-stat-card">
            <p className="iddash-stat-label">Profile Completion</p>
            <p className="iddash-stat-value">{completion.percent}%</p>
            <div className="iddash-progress-track">
              <div className="iddash-progress-fill" style={{ width: `${completion.percent}%` }} />
            </div>
          </div>

          <div className="iddash-stat-card">
            <p className="iddash-stat-label">Citizen ID</p>
            <p className="iddash-stat-value iddash-stat-mono">{profile?.citizenId || "Not yet issued"}</p>
          </div>

          <div className="iddash-stat-card">
            <p className="iddash-stat-label">Member Number</p>
            <p className="iddash-stat-value iddash-stat-mono">{profile?.memberNumber || "—"}</p>
          </div>

          <div className="iddash-stat-card">
            <p className="iddash-stat-label">Verification Progress</p>
            <p className="iddash-stat-value">{requiredCount} of 2 required documents approved</p>
            <div className="iddash-progress-track">
              <div className="iddash-progress-fill" style={{ width: `${(requiredCount / 2) * 100}%` }} />
            </div>
          </div>
        </div>
      </section>

      <section className="iddash-section">
        <h2>Required Documents Checklist</h2>
        <div className="iddash-checklist">
          <p className={hasPrimaryId ? "iddash-check-done" : "iddash-check-pending"}>
            {hasPrimaryId ? "✓" : "○"} Government-issued photo ID (National ID, Passport, Driver License,
            Residence Permit, or Refugee Card)
          </p>
          <p className={hasSelfie ? "iddash-check-done" : "iddash-check-pending"}>
            {hasSelfie ? "✓" : "○"} Selfie
          </p>
        </div>
      </section>

      <section className="iddash-section">
        <div className="iddash-doc-grid">
          <div className="iddash-doc-list">
            <h3>Approved ({approvedDocs.length})</h3>
            {approvedDocs.length === 0 ? (
              <p className="iddash-empty">None yet.</p>
            ) : (
              approvedDocs.map((d) => (
                <p key={d.id} className="iddash-doc-row">{DOCUMENT_TYPE_LABELS[d.documentType] || d.documentType}</p>
              ))
            )}
          </div>

          <div className="iddash-doc-list">
            <h3>Rejected ({rejectedDocs.length})</h3>
            {rejectedDocs.length === 0 ? (
              <p className="iddash-empty">None.</p>
            ) : (
              rejectedDocs.map((d) => (
                <p key={d.id} className="iddash-doc-row iddash-doc-row-rejected">
                  {DOCUMENT_TYPE_LABELS[d.documentType] || d.documentType}
                  {d.rejectionReason && ` — ${d.rejectionReason}`}
                </p>
              ))
            )}
          </div>

          <div className="iddash-doc-list">
            <h3>Needs More Information ({moreInfoDocs.length})</h3>
            {moreInfoDocs.length === 0 ? (
              <p className="iddash-empty">None.</p>
            ) : (
              moreInfoDocs.map((d) => (
                <p key={d.id} className="iddash-doc-row iddash-doc-row-info">
                  {DOCUMENT_TYPE_LABELS[d.documentType] || d.documentType}
                  {d.requestMoreInfoMessage && ` — ${d.requestMoreInfoMessage}`}
                </p>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="iddash-section">
        <h2>Quick Actions</h2>
        <div className="iddash-actions-grid">
          <button type="button" className="iddash-action-button" onClick={scrollToCard}>View Card</button>
          <Link to="/identity/documents" className="iddash-action-button">Upload Documents</Link>
          <Link to="/edit-profile" className="iddash-action-button">Edit Profile</Link>
          <Link to="/profile" className="iddash-action-button">View Verification Status</Link>
          <button type="button" className="iddash-action-button" onClick={scrollToCard}>Print Card</button>
        </div>
      </section>

      <section className="iddash-section" ref={cardSectionRef}>
        <h2>Your Digital ID Card</h2>
        <DigitalIdentityCard profile={profile} loading={loading} onReissue={handleReissue} />
      </section>

      <section className="iddash-section">
        <h2>Recent Verification Activity</h2>
        <div className="iddash-activity">
          {auditEvents.length === 0 ? (
            <p className="iddash-empty">No verification activity yet.</p>
          ) : (
            auditEvents.map((event) => (
              <div className="iddash-activity-item" key={event.id}>
                <p>{AUDIT_TYPE_LABELS[event.type] || event.type}</p>
                <span>{formatDateTime(event.createdAt)}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default IdentityDashboard;
