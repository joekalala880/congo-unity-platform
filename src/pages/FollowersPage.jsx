import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";
import Avatar from "../components/Avatar";

function FollowersPage() {
  const [authStatus, setAuthStatus] = useState("checking"); // checking | signed-out | ready
  const [myProfile, setMyProfile] = useState(null);
  const [allProfiles, setAllProfiles] = useState([]);
  // Tracks which uid we've already fetched Firestore data for, so a token
  // refresh (onAuthStateChanged firing again for the same user) doesn't
  // trigger a redundant profiles query.
  const loadedForUid = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAuthStatus("signed-out");
        return;
      }

      if (loadedForUid.current === user.uid) {
        setAuthStatus("ready");
        return;
      }
      loadedForUid.current = user.uid;

      const snapshot = await getDocs(collection(db, "congoleseProfiles"));

      const profiles = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      }));

      setAllProfiles(profiles);
      setMyProfile(profiles.find((profile) => profile.email === user.email));
      setAuthStatus("ready");
    });

    return () => unsubscribe();
  }, []);

  if (authStatus === "checking") {
    return (
      <section className="register-section">
        <div className="register-header">
          <h1>My Followers</h1>
          <p className="admin-checking">Checking your session...</p>
        </div>
      </section>
    );
  }

  if (authStatus === "signed-out") {
    return <Navigate to="/login" replace />;
  }

  const followers =
    allProfiles.filter((profile) =>
      myProfile?.followers?.includes(profile.email)
    ) || [];

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>My Followers</h1>
        <p>People connected to your Congo Unity profile.</p>
      </div>

      <div className="card">
        <h3>Total Followers</h3>
        <p>{myProfile?.followers?.length || 0}</p>
      </div>

      <div className="cards">
        {followers.length === 0 ? (
          <div className="card">
            <h3>No followers yet</h3>
            <p>Start connecting with community members.</p>
          </div>
        ) : (
          followers.map((profile) => (
            <div className="card" key={profile.id}>
              <Avatar src={profile.profileImageUrl} />

              <h3>
                {profile.firstName} {profile.lastName}
              </h3>

              <p>
                <strong>Province:</strong> {profile.province}
              </p>

              <p>
                <strong>Country:</strong> {profile.currentCountry}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default FollowersPage;
