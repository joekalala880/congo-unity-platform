import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "../firebase";
import { useProfilePhotoUpload } from "../hooks/useProfilePhotoUpload";
import ProfilePhotoField from "../components/ProfilePhotoField";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function mapAuthError(error) {
  switch (error.code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/email-already-in-use":
      return "An account already exists with this email.";
    case "auth/weak-password":
      return "Password must contain at least 6 characters.";
    case "auth/network-request-failed":
      return "Check your internet connection and try again.";
    default:
      return "Something went wrong creating your account. Please try again.";
  }
}

function Register() {
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    dateOfBirth: "",
    province: "",
    territory: "",
    village: "",
    currentCountry: "",
    phone: "",
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const photo = useProfilePhotoUpload();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setFormError("");

    const cleanEmail = formData.email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(cleanEmail)) {
      setFormError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);

    let userCredential;
    try {
      userCredential = await createUserWithEmailAndPassword(
        auth,
        cleanEmail,
        formData.password
      );
    } catch (error) {
      console.error("Firebase error:", error);
      setFormError(mapAuthError(error));
      setIsSubmitting(false);
      return;
    }

    // The account already exists at this point. A failed photo upload
    // should never lose that account or block registration — we finish
    // saving the profile with a blank profileImageUrl (default avatar) and
    // tell the user plainly so they can add a photo later from Edit Profile.
    let profileImageUrl = "";
    let photoWarning = "";
    if (photo.file) {
      try {
        profileImageUrl = await photo.uploadPhoto(userCredential.user.uid);
      } catch (error) {
        console.error("Profile photo upload failed:", error);
        photoWarning =
          " Your profile photo failed to upload, so a default avatar was used — you can add a photo later from Edit Profile.";
      }
    }

    try {
      await setDoc(doc(db, "congoleseProfiles", userCredential.user.uid), {
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        province: formData.province,
        territory: formData.territory,
        village: formData.village,
        currentCountry: formData.currentCountry,
        phone: formData.phone,
        email: cleanEmail,
        profileImageUrl,
        userId: userCredential.user.uid,
        role: "citizen",
        createdAt: new Date(),
        status: "pending_verification",
      });

      alert(`Account created and profile saved successfully!${photoWarning}`);
    } catch (error) {
      console.error("Firebase error:", error);
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitLabel = photo.isUploading
    ? "Uploading photo…"
    : isSubmitting
    ? "Creating account…"
    : "Register Profile";

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>Register Congolese Profile</h1>
        <p>Create your profile to join Congo Unity Platform.</p>
      </div>

      <form className="register-form" onSubmit={handleRegister}>
        {formError && (
          <p className="register-form__error" role="alert">
            {formError}
          </p>
        )}

        <input name="firstName" onChange={handleChange} placeholder="First Name" />
        <input name="middleName" onChange={handleChange} placeholder="Middle Name" />
        <input name="lastName" onChange={handleChange} placeholder="Last Name" />
        <input name="dateOfBirth" onChange={handleChange} type="date" />

        <input name="province" onChange={handleChange} placeholder="Province" />
        <input name="territory" onChange={handleChange} placeholder="Territory" />
        <input name="village" onChange={handleChange} placeholder="Village / City" />
        <input name="currentCountry" onChange={handleChange} placeholder="Current Country" />

        <input name="phone" onChange={handleChange} placeholder="Phone Number" />
        <input name="email" onChange={handleChange} type="email" placeholder="Email Address" />
        <input name="password" onChange={handleChange} type="password" placeholder="Password" />

        <div className="register-form__full-width">
          <ProfilePhotoField
            previewUrl={photo.previewUrl}
            error={photo.error}
            isUploading={photo.isUploading}
            uploadProgress={photo.uploadProgress}
            disabled={isSubmitting}
            onFileSelected={photo.selectFile}
            onRemove={photo.removeFile}
          />
        </div>

        <button type="submit" disabled={isSubmitting}>
          {submitLabel}
        </button>
      </form>
    </section>
  );
}

export default Register;
