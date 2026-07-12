import { useState, useEffect } from "react";
import { auth, storage, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc } from "firebase/firestore";

function UploadID() {
  const [file, setFile] = useState(null);
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const handleUpload = async () => {
    if (!user) {
      alert("Please login first");
      return;
    }

    if (!file) {
      alert("Please choose a file");
      return;
    }

    try {
      setUploading(true);

      const filePath = `ids/${user.uid}/${Date.now()}-${file.name}`;
      const fileRef = ref(storage, filePath);

      await uploadBytes(fileRef, file);

      const fileURL = await getDownloadURL(fileRef);

      await addDoc(collection(db, "identityDocuments"), {
        userId: user.uid,
        email: user.email,
        fileName: file.name,
        fileURL: fileURL,
        filePath: filePath,
        status: "pending_review",
        uploadedAt: new Date(),
      });

      alert("ID uploaded successfully and saved for review!");
      setFile(null);
    } catch (error) {
      console.error("Upload error:", error);
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>Upload Identification</h1>
        <p>Upload your passport, voter card, or national ID.</p>
        <p>{user ? `Logged in as: ${user.email}` : "Loading user..."}</p>
      </div>

      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <button onClick={handleUpload} disabled={uploading}>
        {uploading ? "Uploading..." : "Upload ID"}
      </button>
    </section>
  );
}

export default UploadID;