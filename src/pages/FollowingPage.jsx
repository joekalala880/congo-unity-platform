import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";
import Avatar from "../components/Avatar";

function FollowingPage() {
  const [authStatus, setAuthStatus] = useState("checking"); // checking | signed-out | ready
  const [myEmail, setMyEmail] = useState("");
  const [following, setFollowing] = useState([]);
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

      setMyEmail(user.email);

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

      const peopleIFollow = profiles.filter((profile) =>
        profile.followers?.includes(user.email)
      );

      setFollowing(peopleIFollow);
      setAuthStatus("ready");
    });

    return () => unsubscribe();
  }, []);

  if (authStatus === "checking") {
    return (
      <section className="register-section">
        <div className="register-header">
          <h1>Following</h1>
          <p className="admin-checking">Checking your session...</p>
        </div>
      </section>
    );
  }

  if (authStatus === "signed-out") {
    return <Navigate to="/login" replace />;
  }

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>Following</h1>
        <p>People you follow on Congo Unity Platform.</p>
      </div>

      <div className="card">
        <h3>Your Account</h3>
        <p>{myEmail}</p>
      </div>

      <div className="cards">
        {following.length === 0 ? (
          <div className="card">
            <h3>You are not following anyone yet</h3>
            <p>Go to the Follow page and connect with people.</p>
          </div>
        ) : (
          following.map((profile) => (
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

export default FollowingPage;
