import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  
} from "firebase/firestore";

function EditProfile() {
  const [profileId, setProfileId] = useState("");
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    province: "",
    currentCountry: "",
    profileImage: "",
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const q = query(
        collection(db, "congoleseProfiles"),
        where("email", "==", user.email)
      );

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        setProfileId(docSnap.id);
        setProfile(docSnap.data());
      }
    });

    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  const saveProfile = async (e) => {
    e.preventDefault();

    if (!profileId) {
      alert("Profile not found");
      return;
    }

    try {
      await updateDoc(doc(db, "congoleseProfiles", profileId), {
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        province: profile.province,
        currentCountry: profile.currentCountry,
        profileImage: profile.profileImage,
      });

      alert("Profile updated successfully!");
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>Edit Profile</h1>
        <p>Update your Congo Unity information.</p>
      </div>

      <form className="register-form" onSubmit={saveProfile}>
        <input
          name="firstName"
          value={profile.firstName || ""}
          onChange={handleChange}
          placeholder="First Name"
        />

        <input
          name="lastName"
          value={profile.lastName || ""}
          onChange={handleChange}
          placeholder="Last Name"
        />

        <input
          name="phone"
          value={profile.phone || ""}
          onChange={handleChange}
          placeholder="Phone"
        />

        <input
          name="province"
          value={profile.province || ""}
          onChange={handleChange}
          placeholder="Province"
        />

        <input
          name="currentCountry"
          value={profile.currentCountry || ""}
          onChange={handleChange}
          placeholder="Current Country"
        />
        <input
  name="profileImage"
  value={profile.profileImage || ""}
  onChange={handleChange}
  placeholder="Profile Image URL"
/>

        <button type="submit">Save Changes</button>
      </form>
    </section>
  );
}

export default EditProfile;