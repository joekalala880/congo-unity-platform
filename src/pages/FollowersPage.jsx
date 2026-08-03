import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";
import Avatar from "../components/Avatar";

function FollowersPage() {
  const [myProfile, setMyProfile] = useState(null);
  const [allProfiles, setAllProfiles] = useState([]);

  useEffect(() => {
    const fetchProfiles = async () => {
      const snapshot = await getDocs(collection(db, "congoleseProfiles"));

      const profiles = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      }));

      setAllProfiles(profiles);

      const user = auth.currentUser;

      if (user) {
        const currentProfile = profiles.find(
          (profile) => profile.email === user.email
        );

        setMyProfile(currentProfile);
      }
    };

    fetchProfiles();
  }, []);

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