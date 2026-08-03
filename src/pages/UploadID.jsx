import { useEffect, useRef, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";
import { useIdDocumentUpload } from "../hooks/useIdDocumentUpload";

function UploadID() {
  const [user, setUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const idDoc = useIdDocumentUpload();
  // Guards against a rapid double-click firing two submissions before React
  // has re-rendered with isSubmitting: true — the disabled attribute alone
  // isn't synchronous enough to rule that out.
  const submittingRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();

    if (submittingRef.current) return;

    setSubmitError("");
    setSuccessMessage("");

    if (!user) {
      setSubmitError("Please login first.");
      return;
    }

    if (!idDoc.file) {
      setSubmitError("Please choose a file.");
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      const idToken = await user.getIdToken();
      const { publicId, resourceType } = await idDoc.uploadDocument(idToken);

      await addDoc(collection(db, "identityDocuments"), {
        userId: user.uid,
        email: user.email,
        fileName: idDoc.file.name,
        cloudinaryPublicId: publicId,
        resourceType,
        status: "pending_review",
        uploadedAt: new Date(),
      });

      setSuccessMessage("ID uploaded successfully and saved for review!");
      idDoc.removeFile();
    } catch (error) {
      console.error("Upload error:", error);
      setSubmitError(error?.message || "Upload failed. Please try again.");
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const submitLabel = idDoc.isUploading
    ? `Uploading… ${idDoc.uploadProgress}%`
    : isSubmitting
    ? "Saving…"
    : "Upload ID";

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>Upload Identification</h1>
        <p>Upload your passport, voter card, or national ID.</p>
        <p>{user ? `Logged in as: ${user.email}` : "Loading user..."}</p>
      </div>

      <form className="register-form" onSubmit={handleUpload}>
        {submitError && (
          <p className="register-form__error" role="alert">
            {submitError}
          </p>
        )}

        {successMessage && (
          <p className="register-form__success" role="status">
            {successMessage}
          </p>
        )}

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={(e) => idDoc.selectFile(e.target.files[0])}
          disabled={isSubmitting}
        />

        {idDoc.error && (
          <p className="register-form__error" role="alert">
            {idDoc.error}
          </p>
        )}

        <button type="submit" disabled={isSubmitting}>
          {submitLabel}
        </button>
      </form>
    </section>
  );
}

export default UploadID;
