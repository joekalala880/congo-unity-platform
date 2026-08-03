import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import Avatar from "../components/Avatar";

function FollowSystem() {
  const [profiles, setProfiles] = useState([]);

  const fetchProfiles = async () => {
    const snapshot = await getDocs(collection(db, "congoleseProfiles"));

    const data = snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    }));

    setProfiles(data);
  };

  useEffect(() => {
    (async () => {
      await fetchProfiles();
    })();
  }, []);

  const followUser = async (profileId) => {
    const user = auth.currentUser;

    if (!user) {
      alert("Please login first");
      return;
    }

    await updateDoc(doc(db, "congoleseProfiles", profileId), {
      followers: arrayUnion(user.email),
    });

    fetchProfiles();
  };

  const unfollowUser = async (profileId) => {
    const user = auth.currentUser;

    if (!user) {
      alert("Please login first");
      return;
    }

    await updateDoc(doc(db, "congoleseProfiles", profileId), {
      followers: arrayRemove(user.email),
    });

    fetchProfiles();
  };

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>Follow Community Members</h1>
        <p>Connect with Congolese citizens and diaspora members.</p>
      </div>

      <div className="cards">
        {profiles.map((profile) => {
          const user = auth.currentUser;
          const isMe = user?.email === profile.email;
          const isFollowing = profile.followers?.includes(user?.email);

          return (
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

              <p>
                <strong>Followers:</strong> {profile.followers?.length || 0}
              </p>

              {!isMe &&
                (isFollowing ? (
                  <button onClick={() => unfollowUser(profile.id)}>
                    Unfollow
                  </button>
                ) : (
                  <button onClick={() => followUser(profile.id)}>
                    Follow
                  </button>
                ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default FollowSystem;