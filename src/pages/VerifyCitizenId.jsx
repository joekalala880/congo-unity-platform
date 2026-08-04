import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { DEFAULT_AVATAR } from "../components/defaultAvatar";
import VerificationBadge from "../components/identity/VerificationBadge";
import "./VerifyCitizenId.css";

function formatDate(value) {
  if (!value) return "—";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function formatDateTime(value) {
  return value.toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

// Public page — no auth required. Reads ONLY publicVerifications/{citizenId},
// a minimal mirror that deliberately never contains email, phone, DOB,
// document numbers, addresses, reviewer notes, or uploaded documents. See
// the publicVerifications rules block in firestore.rules for why this
// mirror exists instead of reading congoleseProfiles directly — Firestore
// rules can't redact individual fields from a document read, so this route
// never queries congoleseProfiles under any circumstances.
//
// "Revoked or expired" is not modeled anywhere in the data today (there's
// no Citizen ID expiry/revocation mechanism), so that state is intentionally
// not implemented here rather than faked.
function VerifyCitizenId() {
  const { citizenId } = useParams();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [checkedAt, setCheckedAt] = useState(null);

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
          setCheckedAt(new Date());
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
          <h3>Citizen ID not found</h3>
          <p>"{citizenId}" isn't a recognized Congo Unity Citizen ID.</p>
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

          <VerificationBadge status={record.status} />

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
            {record.province && (
              <div>
                <span className="vfy-label">Province of Origin</span>
                <span className="vfy-value">{record.province}</span>
              </div>
            )}
            {record.currentCountry && (
              <div>
                <span className="vfy-label">Current Country</span>
                <span className="vfy-value">{record.currentCountry}</span>
              </div>
            )}
          </div>

          {record.status === "verified" && (
            <p className="vfy-statement">✓ Verified by Congo Unity</p>
          )}
          {record.status === "suspended" && (
            <p className="vfy-statement vfy-statement-warning">
              This member's verification has been suspended.
            </p>
          )}
          {record.status === "rejected" && (
            <p className="vfy-statement vfy-statement-warning">
              This Citizen ID has not passed verification.
            </p>
          )}
          {(record.status === "pending_verification" || record.status === "under_review") && (
            <p className="vfy-statement">Verification is in progress for this Citizen ID.</p>
          )}

          {checkedAt && <p className="vfy-timestamp">Checked {formatDateTime(checkedAt)}</p>}
        </div>
      )}
    </section>
  );
}

export default VerifyCitizenId;
