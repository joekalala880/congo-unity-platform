import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";
import Avatar from "../components/Avatar";

function FollowingPage() {
  const [myEmail, setMyEmail] = useState("");
  const [following, setFollowing] = useState([]);

  useEffect(() => {
    const fetchFollowing = async () => {
      const user = auth.currentUser;

      if (!user) return;

      setMyEmail(user.email);

      const snapshot = await getDocs(collection(db, "congoleseProfiles"));

      const profiles = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      }));

      const peopleIFollow = profiles.filter((profile) =>
        profile.followers?.includes(user.email)
      );

      setFollowing(peopleIFollow);
    };

    fetchFollowing();
  }, []);

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