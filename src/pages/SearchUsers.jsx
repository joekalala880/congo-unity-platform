import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

function SearchUsers() {
  const [profiles, setProfiles] = useState([]);
  const [search, setSearch] = useState("");

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
    if (!user) return alert("Please login first");

    await updateDoc(doc(db, "congoleseProfiles", profileId), {
      followers: arrayUnion(user.email),
    });

    fetchProfiles();
  };
  

  const unfollowUser = async (profileId) => {
    const user = auth.currentUser;
    if (!user) return alert("Please login first");

    await updateDoc(doc(db, "congoleseProfiles", profileId), {
        
      followers: arrayRemove(user.email),
    });

    fetchProfiles();
  };


  const filteredProfiles = profiles.filter((profile) => {
    const fullText = `
      ${profile.firstName || ""}
      ${profile.lastName || ""}
      ${profile.email || ""}
      ${profile.province || ""}
      ${profile.currentCountry || ""}
    `.toLowerCase();

    return fullText.includes(search.toLowerCase());
  });

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>Search Users</h1>
        <p>Search all registered Congolese profiles from Firebase.</p>
      </div>

      <div className="register-form">
        <input
          type="text"
          placeholder="Search by name, email, province, country..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="cards">
        {filteredProfiles.map((profile) => {
          const user = auth.currentUser;
          const isMe = user?.email === profile.email;
          const isFollowing = profile.followers?.includes(user?.email);

          return (
            <div className="card" key={profile.id}>
              <Avatar src={profile.profileImageUrl} />

              <Link to={`/profile/${encodeURIComponent(profile.email)}`}>
                <h3>
                  {profile.firstName} {profile.lastName}
                </h3>
              </Link>

              <p>
                <strong>Email:</strong> {profile.email}
              </p>

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

export default SearchUsers;