import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { DEFAULT_AVATAR } from "../components/defaultAvatar";
import "./VerifyCitizenId.css";

const STATUS_LABELS = {
  pending_verification: "Pending Verification",
  under_review: "Under Review",
  verified: "Verified",
  rejected: "Not Verified",
  suspended: "Suspended",
};

function statusBadgeClass(status) {
  if (status === "verified") return "vfy-badge-verified";
  if (status === "under_review") return "vfy-badge-review";
  if (status === "suspended") return "vfy-badge-suspended";
  return "vfy-badge-pending";
}

function formatDate(value) {
  if (!value) return "—";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

// Public page — no auth required. Reads ONLY publicVerifications/{citizenId},
// a minimal mirror that deliberately never contains email, phone, DOB,
// document numbers, addresses, or uploaded documents. See the
// publicVerifications rules block in firestore.rules for why this mirror
// exists instead of reading congoleseProfiles directly.
function VerifyCitizenId() {
  const { citizenId } = useParams();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setNotFound(false);

      try {
        const snap = await getDoc(doc(db, "publicVerifications", citizenId));
        if (cancelled) return;

        if (snap.exists()) {
          setRecord(snap.data());
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error("Failed to load verification record:", err);
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [citizenId]);

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>Citizen Verification</h1>
        <p>Congo Unity national identity verification lookup</p>
      </div>

      {loading && <p className="vfy-loading">Checking {citizenId}…</p>}

      {!loading && notFound && (
        <div className="vfy-card vfy-not-found">
          <h3>No record found</h3>
          <p>“{citizenId}” isn't a recognized Citizen ID.</p>
        </div>
      )}

      {!loading && record && (
        <div className="vfy-card">
          <img
            src={record.profileImageUrl || DEFAULT_AVATAR}
            alt={`${record.firstName} ${record.lastName}`}
            className="profile-avatar"
          />

          <h3>{record.preferredName || record.firstName} {record.lastName}</h3>

          <span className={`vfy-badge ${statusBadgeClass(record.status)}`}>
            {STATUS_LABELS[record.status] || record.status}
          </span>

          <div className="vfy-grid">
            <div>
              <span className="vfy-label">Citizen ID</span>
              <span className="vfy-value">{record.citizenId}</span>
            </div>
            <div>
              <span className="vfy-label">Member Since</span>
              <span className="vfy-value">{formatDate(record.registrationDate)}</span>
            </div>
            {record.status === "verified" && (
              <div>
                <span className="vfy-label">Verification Date</span>
                <span className="vfy-value">{formatDate(record.verifiedAt)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default VerifyCitizenId;
