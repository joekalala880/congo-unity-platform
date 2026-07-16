import { useCallback, useEffect, useRef, useState } from "react";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { storage } from "../firebase";

// Shared behavior for the profile-photo picker used on Register and Edit
// Profile: validates the chosen file client-side (type + size), manages a
// local object-URL preview, and uploads to Storage on demand once a uid is
// known. Upload timing differs between the two pages (Register only has a
// uid after the Auth account exists; Edit Profile already has one), so this
// only exposes uploadPhoto(uid) rather than uploading eagerly on selection.
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

// Firebase Storage's resumable-upload client treats most failures (including,
// it turns out, "this bucket doesn't exist") as retryable and keeps retrying
// with backoff instead of ever calling the state_changed error callback —
// confirmed live against production, where a misconfigured bucket left the
// UI stuck at "Uploading photo… 0%" forever with no console error and no
// visible network activity. Since the SDK won't reliably give up on its own,
// this hook enforces its own ceiling so the UI can never hang indefinitely.
const UPLOAD_TIMEOUT_MS = 20000;

export function useProfilePhotoUpload() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const objectUrlRef = useRef("");

  const revokePreview = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = "";
    }
  }, []);

  useEffect(() => revokePreview, [revokePreview]);

  const selectFile = useCallback(
    (selected) => {
      if (!selected) {
        revokePreview();
        setFile(null);
        setPreviewUrl("");
        setError("");
        return;
      }

      if (!ACCEPTED_TYPES.includes(selected.type)) {
        setError("Please choose a JPG, JPEG, PNG, or WEBP image.");
        return;
      }

      if (selected.size > MAX_SIZE_BYTES) {
        setError("Image must be 5 MB or smaller.");
        return;
      }

      setError("");
      revokePreview();
      const url = URL.createObjectURL(selected);
      objectUrlRef.current = url;
      setFile(selected);
      setPreviewUrl(url);
    },
    [revokePreview]
  );

  const removeFile = useCallback(() => {
    revokePreview();
    setFile(null);
    setPreviewUrl("");
    setError("");
    setUploadProgress(0);
  }, [revokePreview]);

  // Resolves to "" if no file was ever selected, so callers can always save
  // the result straight into profileImageUrl without a null check. The
  // returned promise is guaranteed to settle within UPLOAD_TIMEOUT_MS no
  // matter what the underlying SDK does, and isUploading is always reset via
  // .finally() regardless of how it settles.
  const uploadPhoto = useCallback(
    (uid) => {
      if (!file) return Promise.resolve("");

      setIsUploading(true);
      setUploadProgress(0);
      setError("");

      const photoRef = ref(storage, `profilePhotos/${uid}/profile`);
      const task = uploadBytesResumable(photoRef, file, { contentType: file.type });

      let timeoutId;
      const clearUploadTimeout = () => clearTimeout(timeoutId);

      const uploadPromise = new Promise((resolve, reject) => {
        task.on(
          "state_changed",
          (snapshot) => {
            setUploadProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
          },
          (uploadError) => {
            reject(uploadError);
          },
          async () => {
            try {
              const url = await getDownloadURL(task.snapshot.ref);
              setUploadProgress(100);
              resolve(url);
            } catch (downloadError) {
              reject(downloadError);
            }
          }
        );
      });

      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          task.cancel();
          reject(
            new Error(
              `Photo upload timed out after ${UPLOAD_TIMEOUT_MS / 1000} seconds. Please check your connection and try again.`
            )
          );
        }, UPLOAD_TIMEOUT_MS);
      });

      return Promise.race([uploadPromise, timeoutPromise])
        .catch((uploadError) => {
          const message = uploadError?.code
            ? `Photo upload failed (${uploadError.code}): ${uploadError.message}`
            : uploadError?.message || "Photo upload failed. Please try again.";
          setError(message);
          throw uploadError;
        })
        .finally(() => {
          clearUploadTimeout();
          setIsUploading(false);
        });
    },
    [file]
  );

  return {
    file,
    previewUrl,
    error,
    isUploading,
    uploadProgress,
    selectFile,
    removeFile,
    uploadPhoto,
  };
}
