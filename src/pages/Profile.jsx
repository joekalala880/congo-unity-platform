import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Link } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { DEFAULT_AVATAR } from "../components/defaultAvatar";

function Profile() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const q = query(
        collection(db, "congoleseProfiles"),
        where("email", "==", user.email)
      );

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        setProfile(snapshot.docs[0].data());
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>My Profile</h1>
        <p>Your Congo Unity information</p>
      </div>

      {profile && (
        <div className="card">
          <img
            src={profile.profileImageUrl || DEFAULT_AVATAR}
            alt={`${profile.firstName} ${profile.lastName}`}
            className="profile-avatar"
          />

          <h3>
            {profile.firstName} {profile.lastName}
          </h3>

          <p>
            <strong>Email:</strong> {profile.email}
          </p>

          <p>
            <strong>Phone:</strong> {profile.phone}
          </p>

          <p>
            <strong>Province:</strong> {profile.province}
          </p>

          <p>
            <strong>Country:</strong> {profile.currentCountry}
          </p>

          <p>
            <strong>Status:</strong> {profile.status}
          </p>

          <Link to="/edit-profile">
            <button>Edit Profile</button>
          </Link>
        </div>
      )}
    </section>
  );
}

export default Profile;