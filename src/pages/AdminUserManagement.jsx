import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import Avatar from "../components/Avatar";
import "./AdminUserManagement.css";

const STATUS_LABELS = {
  pending_verification: "Pending Verification",
  under_review: "Under Review",
  verified: "Verified",
  rejected: "Rejected",
  suspended: "Suspended",
};

function statusBadgeClass(status) {
  if (status === "verified") return "um-badge-verified";
  if (status === "under_review") return "um-badge-review";
  if (status === "rejected") return "um-badge-rejected";
  if (status === "suspended") return "um-badge-suspended";
  return "um-badge-pending";
}

function formatDate(value) {
  if (!value) return "Unknown";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function RowSkeleton() {
  return (
    <div className="um-row">
      <div className="um-skeleton um-skeleton-avatar" />
      <div className="um-row-body">
        <div className="um-skeleton um-skeleton-line" style={{ width: "35%" }} />
        <div className="um-skeleton um-skeleton-line" style={{ width: "60%" }} />
      </div>
    </div>
  );
}

function AdminUserManagement() {
  const [currentUid, setCurrentUid] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUid(user?.uid || null);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");

      try {
        const snapshot = await getDocs(collection(db, "congoleseProfiles"));
        if (!cancelled) {
          setProfiles(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        }
      } catch (err) {
        console.error("Failed to load users:", err);
        if (!cancelled) setError("We couldn't load users right now. Please try again.");
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

  const filtered = profiles.filter((p) => {
    if (statusFilter !== "all" && (p.status || "pending_verification") !== statusFilter) return false;
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      const haystack = [p.firstName, p.lastName, p.email, p.province, p.currentCountry]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });

  const runAction = async (profile, updates, message) => {
    setBusyId(profile.id);
    setError("");

    try {
      await updateDoc(doc(db, "congoleseProfiles", profile.id), updates);
      setProfiles((prev) => prev.map((p) => (p.id === profile.id ? { ...p, ...updates } : p)));
      showSuccess(message);
    } catch (err) {
      console.error("Failed to update user:", err);
      setError(`Couldn't update ${profile.firstName || profile.email}. Please try again.`);
    } finally {
      setBusyId(null);
    }
  };

  const approve = (profile) =>
    runAction(profile, { status: "verified", rejectionReason: "" }, `${profile.firstName || profile.email} approved.`);

  const markUnderReview = (profile) =>
    runAction(profile, { status: "under_review" }, `${profile.firstName || profile.email} marked under review.`);

  const reject = (profile) => {
    const reason = window.prompt(`Reason for rejecting ${profile.firstName || profile.email}?`);
    if (reason === null) return;
    if (!reason.trim()) {
      setError("A rejection reason is required.");
      return;
    }
    runAction(
      profile,
      { status: "rejected", rejectionReason: reason.trim() },
      `${profile.firstName || profile.email} rejected.`
    );
  };

  const suspend = (profile) => {
    if (profile.userId === currentUid) {
      setError("You can't suspend your own account.");
      return;
    }
    if (!window.confirm(`Suspend ${profile.firstName || profile.email}? They'll be marked as suspended platform-wide.`)) return;
    runAction(
      profile,
      { status: "suspended", previousStatus: profile.status || "pending_verification" },
      `${profile.firstName || profile.email} suspended.`
    );
  };

  const reactivate = (profile) => {
    runAction(
      profile,
      { status: profile.previousStatus || "pending_verification" },
      `${profile.firstName || profile.email} reactivated.`
    );
  };

  return (
    <div className="um-page">
      <div className="um-header">
        <div>
          <h1>User Management</h1>
          <p>Search, verify, and manage Congo Unity accounts.</p>
        </div>
      </div>

      {successMessage && <p className="register-form__success" role="status">{successMessage}</p>}
      {error && <p className="register-form__error" role="alert">{error}</p>}

      <div className="um-filters">
        <input
          type="text"
          placeholder="Search by name, email, province…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search users"
        />

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by verification status">
          <option value="all">All statuses</option>
          <option value="pending_verification">Pending Verification</option>
          <option value="under_review">Under Review</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {loading ? (
        <div className="um-list">
          <RowSkeleton />
          <RowSkeleton />
          <RowSkeleton />
        </div>
      ) : filtered.length === 0 ? (
        <div className="um-empty">
          <p>No users match your filters.</p>
        </div>
      ) : (
        <>
          <p className="um-count">{filtered.length} user{filtered.length === 1 ? "" : "s"}</p>

          <div className="um-list">
            {filtered.map((profile) => {
              const status = profile.status || "pending_verification";
              const isSelf = profile.userId === currentUid;

              return (
                <div className="um-row" key={profile.id}>
                  <Avatar src={profile.profileImageUrl} className="um-row-avatar" alt={profile.firstName} />

                  <div className="um-row-body">
                    <div className="um-row-title">
                      <strong>{profile.firstName} {profile.lastName}</strong>
                      <span className={`um-badge ${statusBadgeClass(status)}`}>{STATUS_LABELS[status] || status}</span>
                      {isSelf && <span className="um-badge um-badge-self">You</span>}
                    </div>
                    <p className="um-row-meta">{profile.email} · {profile.province || "—"}, {profile.currentCountry || "—"}</p>
                    <p className="um-row-meta">Registered {formatDate(profile.createdAt)}</p>
                  </div>

                  <div className="um-row-actions">
                    <button type="button" onClick={() => setSelectedProfile(profile)}>View</button>

                    {status !== "under_review" && status !== "verified" && (
                      <button type="button" onClick={() => markUnderReview(profile)} disabled={busyId === profile.id}>Mark Under Review</button>
                    )}

                    {status !== "verified" && (
                      <button type="button" onClick={() => approve(profile)} disabled={busyId === profile.id}>Approve</button>
                    )}

                    {status !== "rejected" && (
                      <button type="button" onClick={() => reject(profile)} disabled={busyId === profile.id}>Reject</button>
                    )}

                    {status === "suspended" ? (
                      <button type="button" onClick={() => reactivate(profile)} disabled={busyId === profile.id}>Reactivate</button>
                    ) : (
                      <button
                        type="button"
                        className="um-suspend-button"
                        onClick={() => suspend(profile)}
                        disabled={busyId === profile.id || isSelf}
                        title={isSelf ? "You can't suspend your own account" : undefined}
                      >
                        Suspend
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {selectedProfile && (
        <div className="um-modal-backdrop" role="presentation" onClick={() => setSelectedProfile(null)}>
          <div className="um-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="um-modal-close" onClick={() => setSelectedProfile(null)} aria-label="Close">✕</button>

            <Avatar src={selectedProfile.profileImageUrl} className="um-modal-avatar" alt={selectedProfile.firstName} />

            <h2>{selectedProfile.firstName} {selectedProfile.middleName} {selectedProfile.lastName}</h2>
            <span className={`um-badge ${statusBadgeClass(selectedProfile.status || "pending_verification")}`}>
              {STATUS_LABELS[selectedProfile.status || "pending_verification"]}
            </span>

            <div className="um-modal-details">
              <p><strong>Email:</strong> {selectedProfile.email}</p>
              <p><strong>Phone:</strong> {selectedProfile.phone || "—"}</p>
              <p><strong>Province:</strong> {selectedProfile.province || "—"}</p>
              <p><strong>Territory:</strong> {selectedProfile.territory || "—"}</p>
              <p><strong>Village/City:</strong> {selectedProfile.village || "—"}</p>
              <p><strong>Country:</strong> {selectedProfile.currentCountry || "—"}</p>
              <p><strong>Registered:</strong> {formatDate(selectedProfile.createdAt)}</p>
              {selectedProfile.rejectionReason && (
                <p><strong>Rejection reason:</strong> {selectedProfile.rejectionReason}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUserManagement;
