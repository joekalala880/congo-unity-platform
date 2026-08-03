import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import Avatar from "../components/Avatar";

function PublicProfile() {
  const { email } = useParams();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const snapshot = await getDocs(collection(db, "congoleseProfiles"));

      const profiles = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      }));

      const foundProfile = profiles.find(
        (person) => person.email === decodeURIComponent(email)
      );

      setProfile(foundProfile);
    };

    fetchProfile();
  }, [email]);

  if (!profile) {
    return (
      <section className="register-section">
        <h1>Profile not found</h1>
      </section>
    );
  }

  return (
    <section className="register-section">
      <div className="register-header">
        <Avatar src={profile.profileImageUrl} />

        <h1>
          {profile.firstName} {profile.lastName}
        </h1>

        <p>{profile.email}</p>
      </div>

      <div className="card">
        <p><strong>Province:</strong> {profile.province}</p>
        <p><strong>Country:</strong> {profile.currentCountry}</p>
        <p><strong>Status:</strong> {profile.status}</p>
        <p><strong>Followers:</strong> {profile.followers?.length || 0}</p>

        <Link to="/direct-messages">
          <button>Message</button>
        </Link>
      </div>
    </section>
  );
}

export default PublicProfile;