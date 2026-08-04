import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Link } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { DEFAULT_AVATAR } from "../components/defaultAvatar";
import { useIdentity } from "../hooks/useIdentity";
import { getVerificationUrl } from "../services/identityService";
import QRCodeDisplay from "../components/identity/QRCodeDisplay";
import "./Profile.css";

const STATUS_LABELS = {
  pending_verification: "Pending",
  under_review: "Under Review",
  verified: "Verified",
  rejected: "Rejected",
  suspended: "Suspended",
};

function statusBadgeClass(status) {
  if (status === "verified") return "id-badge-verified";
  if (status === "under_review") return "id-badge-review";
  if (status === "rejected") return "id-badge-rejected";
  if (status === "suspended") return "id-badge-suspended";
  return "id-badge-pending";
}

function formatDate(value) {
  if (!value) return "—";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function Profile() {
  const [profileId, setProfileId] = useState("");
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const q = query(collection(db, "congoleseProfiles"), where("email", "==", user.email));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        setProfileId(snapshot.docs[0].id);
        setProfile(snapshot.docs[0].data());
      }
    });

    return () => unsubscribe();
  }, []);

  const { identity, generating, error: identityError } = useIdentity(profileId, profile);

  const status = profile?.status || "pending_verification";
  const badge = { label: STATUS_LABELS[status] || status, className: statusBadgeClass(status) };
  const publicProfileUrl = profile ? `${window.location.origin}/profile/${encodeURIComponent(profile.email)}` : "";

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>My Digital Identity</h1>
        <p>Your Congo Unity national identity profile</p>
      </div>

      {profile && (
        <div className="id-card">
          <div className="id-card-top">
            <img
              src={profile.profileImageUrl || DEFAULT_AVATAR}
              alt={`${profile.firstName} ${profile.lastName}`}
              className="profile-avatar"
            />

            <div className="id-card-heading">
              <h3>
                {profile.preferredName || profile.firstName} {profile.lastName}
              </h3>
              <span className={`id-badge ${badge.className}`}>{badge.label}</span>
            </div>
          </div>

          <div className="id-section">
            <h4>Identity</h4>

            {generating && <p className="id-generating">Setting up your Digital ID…</p>}
            {identityError && <p className="register-form__error" role="alert">{identityError}</p>}

            {identity?.citizenId && (
              <div className="id-grid">
                <div>
                  <span className="id-label">Citizen ID</span>
                  <span className="id-value">{identity.citizenId}</span>
                </div>
                <div>
                  <span className="id-label">Member Number</span>
                  <span className="id-value">{identity.memberNumber}</span>
                </div>
                <div>
                  <span className="id-label">Registration Date</span>
                  <span className="id-value">{formatDate(identity.registrationDate)}</span>
                </div>
                <div>
                  <span className="id-label">Public Profile</span>
                  <a className="id-value id-link" href={publicProfileUrl}>{publicProfileUrl}</a>
                </div>
              </div>
            )}

            {identity?.citizenId && (
              <div className="id-qr">
                <QRCodeDisplay value={getVerificationUrl(identity.citizenId)} size={140} />
                <p className="id-qr-caption">Scan to verify this Citizen ID</p>
              </div>
            )}
          </div>

          <div className="id-section">
            <h4>Personal Information</h4>
            <div className="id-grid">
              <div><span className="id-label">Gender</span><span className="id-value">{profile.gender || "—"}</span></div>
              <div><span className="id-label">Date of Birth</span><span className="id-value">{profile.dateOfBirth || "—"}</span></div>
              <div><span className="id-label">Place of Birth</span><span className="id-value">{profile.placeOfBirth || "—"}</span></div>
              <div><span className="id-label">Nationality</span><span className="id-value">{profile.nationality || "—"}</span></div>
              <div><span className="id-label">Province of Origin</span><span className="id-value">{profile.province || "—"}</span></div>
              <div><span className="id-label">Territory</span><span className="id-value">{profile.territory || "—"}</span></div>
              <div><span className="id-label">Village</span><span className="id-value">{profile.village || "—"}</span></div>
              <div><span className="id-label">Current Country</span><span className="id-value">{profile.currentCountry || "—"}</span></div>
              <div><span className="id-label">Current City</span><span className="id-value">{profile.currentCity || "—"}</span></div>
              <div><span className="id-label">Phone</span><span className="id-value">{profile.phone || "—"}</span></div>
              <div><span className="id-label">Email</span><span className="id-value">{profile.email}</span></div>
            </div>
          </div>

          <div className="id-actions">
            <Link to="/edit-profile">
              <button>Edit Profile</button>
            </Link>
            <Link to="/identity/documents">
              <button>Manage Identity Documents</button>
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

export default Profile;
