import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "../firebase";

const NOTIFICATION_TYPES = [
  { key: "news", label: "Platform news" },
  { key: "comments", label: "Comments and replies" },
  { key: "verification", label: "Identity verification updates" },
  { key: "emergencies", label: "Emergency alerts" },
];

function ChangePasswordCard({ user }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation don't match.");
      return;
    }

    setStatus("saving");
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setStatus("done");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Change password error:", err);
      setError(
        err.code === "auth/wrong-password" || err.code === "auth/invalid-credential"
          ? "Current password is incorrect."
          : err.message || "Couldn't change your password. Please try again."
      );
      setStatus("idle");
    }
  };

  return (
    <div className="card">
      <h3>Change Password</h3>

      <form className="register-form" onSubmit={handleSubmit}>
        {status === "done" && <p className="register-form__success" role="status">Password updated.</p>}
        {error && <p className="register-form__error" role="alert">{error}</p>}

        <input
          type="password"
          placeholder="Current Password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={status === "saving"}>
          {status === "saving" ? "Saving…" : "Update Password"}
        </button>
      </form>
    </div>
  );
}

function NotificationPreferencesCard({ profileId, profile, onSaved }) {
  const [prefs, setPrefs] = useState(
    profile.notificationPreferences || { news: true, comments: true, verification: true, emergencies: true }
  );
  const [status, setStatus] = useState("idle");

  const toggle = (key) => setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleSave = async () => {
    setStatus("saving");
    try {
      await updateDoc(doc(db, "congoleseProfiles", profileId), { notificationPreferences: prefs });
      onSaved(prefs);
      setStatus("done");
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err) {
      console.error("Failed to save notification preferences:", err);
      setStatus("error");
    }
  };

  return (
    <div className="card">
      <h3>Notifications</h3>
      <p>Control alerts for news, comments, verification, and emergencies.</p>

      <div className="settings-checkbox-list">
        {NOTIFICATION_TYPES.map((type) => (
          <label key={type.key} className="settings-checkbox-row">
            <input type="checkbox" checked={!!prefs[type.key]} onChange={() => toggle(type.key)} />
            {type.label}
          </label>
        ))}
      </div>

      <button type="button" onClick={handleSave} disabled={status === "saving"}>
        {status === "saving" ? "Saving…" : "Save Preferences"}
      </button>
      {status === "done" && <p className="register-form__success" role="status">Preferences saved.</p>}
      {status === "error" && <p className="register-form__error" role="alert">Couldn't save. Please try again.</p>}
    </div>
  );
}

function AccountDeletionCard({ user, existingRequest, onRequested }) {
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!window.confirm("Submit a request to delete your Congo Unity account? An admin will review it.")) return;

    setStatus("saving");
    try {
      const ref = await addDoc(collection(db, "accountDeletionRequests"), {
        userId: user.uid,
        email: user.email,
        reason: reason.trim(),
        status: "pending",
        createdAt: serverTimestamp(),
        resolvedAt: null,
        resolvedBy: null,
      });
      onRequested({ id: ref.id, status: "pending", reason: reason.trim() });
      setStatus("done");
    } catch (err) {
      console.error("Failed to submit deletion request:", err);
      setError("Couldn't submit your request. Please try again.");
      setStatus("idle");
    }
  };

  if (existingRequest?.status === "pending") {
    return (
      <div className="card">
        <h3>Delete Account</h3>
        <p>
          A deletion request is pending admin review. You'll be contacted at {user.email} once it's
          actioned.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3>Delete Account</h3>
      <p>
        Submitting this sends a request to an admin for manual review — it does not delete your
        account or data immediately.
      </p>

      <form className="register-form" onSubmit={handleSubmit}>
        {error && <p className="register-form__error" role="alert">{error}</p>}
        {status === "done" && <p className="register-form__success" role="status">Deletion request submitted.</p>}

        <textarea
          placeholder="Reason (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <button type="submit" disabled={status === "saving"}>
          {status === "saving" ? "Submitting…" : "Request Account Deletion"}
        </button>
      </form>
    </div>
  );
}

function Settings() {
  const [user, setUser] = useState(null);
  const [profileId, setProfileId] = useState("");
  const [profile, setProfile] = useState(null);
  const [deletionRequest, setDeletionRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const profileSnap = await getDocs(
          query(collection(db, "congoleseProfiles"), where("email", "==", currentUser.email))
        );
        if (!profileSnap.empty) {
          setProfileId(profileSnap.docs[0].id);
          setProfile(profileSnap.docs[0].data());
        }

        const deletionSnap = await getDocs(
          query(collection(db, "accountDeletionRequests"), where("userId", "==", currentUser.uid))
        );
        const pending = deletionSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .find((r) => r.status === "pending");
        if (pending) setDeletionRequest(pending);
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="settings-page">
      <section className="settings-hero">
        <div className="settings-overlay">
          <h1>Settings</h1>
          <h3>Control your Congo Unity experience.</h3>

          <p>
            Manage your language, notifications, privacy, region, and personal
            preferences.
          </p>
        </div>
      </section>

      <section className="settings-section">
        <h2>User Preferences</h2>

        <div className="cards">
          <div className="card">
            <h3>Language</h3>
            <p>Choose English, French, Lingala, Swahili, Kikongo, or Tshiluba.</p>
          </div>

          <div className="card">
            <h3>Region</h3>
            <p>Set your province, city, or diaspora country for personalized updates.</p>
          </div>

          <div className="card">
            <h3>Privacy</h3>
            <p>
              Your profile visibility is currently <strong>{profile?.visibility || "public"}</strong>.
              Change it from <Link to="/edit-profile">Edit Profile</Link>.
            </p>
          </div>
        </div>
      </section>

      {loading && <p className="id-generating">Loading…</p>}

      {!loading && !user && (
        <section className="settings-section">
          <p>
            Please <Link to="/login">log in</Link> to manage your account settings.
          </p>
        </section>
      )}

      {!loading && user && (
        <section className="settings-section">
          <h2>Account</h2>
          <div className="cards">
            <ChangePasswordCard user={user} />

            {profileId && profile && (
              <NotificationPreferencesCard
                profileId={profileId}
                profile={profile}
                onSaved={(prefs) => setProfile((prev) => ({ ...prev, notificationPreferences: prefs }))}
              />
            )}

            <AccountDeletionCard
              user={user}
              existingRequest={deletionRequest}
              onRequested={setDeletionRequest}
            />
          </div>
        </section>
      )}
    </div>
  );
}

export default Settings;
