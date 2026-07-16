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
import { useProfilePhotoUpload } from "../hooks/useProfilePhotoUpload";
import ProfilePhotoField from "../components/ProfilePhotoField";

function EditProfile() {
  const [profileId, setProfileId] = useState("");
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    province: "",
    currentCountry: "",
    profileImageUrl: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const photo = useProfilePhotoUpload();

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

    const user = auth.currentUser;
    if (!user) {
      alert("Please login first");
      return;
    }

    setIsSaving(true);

    const updates = {
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone,
      province: profile.province,
      currentCountry: profile.currentCountry,
    };

    // Only touch profileImageUrl if the user actually picked a replacement —
    // otherwise the existing saved photo is left alone.
    if (photo.file) {
      try {
        updates.profileImageUrl = await photo.uploadPhoto(user.uid);
      } catch (error) {
        console.error("Profile photo upload failed:", error);
        alert(
          "Your other profile changes were not saved because the new photo failed to upload. Please try again."
        );
        setIsSaving(false);
        return;
      }
    }

    try {
      await updateDoc(doc(db, "congoleseProfiles", profileId), updates);

      if (updates.profileImageUrl) {
        setProfile((prev) => ({ ...prev, profileImageUrl: updates.profileImageUrl }));
        photo.removeFile();
      }

      alert("Profile updated successfully!");
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setIsSaving(false);
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

        <div className="register-form__full-width">
          <ProfilePhotoField
            previewUrl={photo.previewUrl}
            existingImageUrl={profile.profileImageUrl}
            error={photo.error}
            isUploading={photo.isUploading}
            uploadProgress={photo.uploadProgress}
            disabled={isSaving}
            onFileSelected={photo.selectFile}
            onRemove={photo.removeFile}
          />
        </div>

        <button type="submit" disabled={isSaving}>
          {photo.isUploading ? "Uploading photo…" : isSaving ? "Saving…" : "Save Changes"}
        </button>
      </form>
    </section>
  );
}

export default EditProfile;
