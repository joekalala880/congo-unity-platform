import { useCallback, useEffect, useRef, useState } from "react";

// Shared behavior for the profile-photo picker used on Register and Edit
// Profile: validates the chosen file client-side (type + size), manages a
// local object-URL preview, and uploads to Cloudinary on demand. Upload
// timing differs between the two pages (Register only has a uid after the
// Auth account exists; Edit Profile already has one), so this only exposes
// uploadPhoto(uid) rather than uploading eagerly on selection.
//
// Photos previously went to Firebase Storage, but that requires the Blaze
// (pay-as-you-go) plan, which this project isn't upgrading to. Cloudinary's
// free tier works on an unsigned upload preset instead — the browser posts
// directly to Cloudinary's API with just a cloud name and preset name, no
// secret involved, so there is nothing here that needs to stay off the
// client. Firebase Authentication and Firestore are untouched by this
// change; only this one file talks to Cloudinary.
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

// Same reasoning as the old Storage version: don't trust the upload to ever
// give up on its own, cap it client-side so the UI can never hang forever.
const UPLOAD_TIMEOUT_MS = 20000;

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

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
  // returned promise is guaranteed to settle within UPLOAD_TIMEOUT_MS, and
  // isUploading is always reset via .finally() regardless of how it settles.
  //
  // uid is only used to group uploads into a per-user Cloudinary folder for
  // easier browsing in the Cloudinary console — unlike the old Storage
  // rules, Cloudinary's unsigned uploads don't enforce ownership of that
  // path server-side, so this is organizational only, not a security
  // boundary. Each replacement upload also lands at a new Cloudinary URL
  // (unsigned uploads can't overwrite a prior asset without a signature),
  // so profileImageUrl always points at the latest one and older uploads
  // are simply left orphaned in Cloudinary rather than deleted.
  const uploadPhoto = useCallback(
    (uid) => {
      if (!file) return Promise.resolve("");

      if (!CLOUD_NAME || !UPLOAD_PRESET) {
        const message =
          "Photo upload isn't configured yet (missing Cloudinary environment variables).";
        setError(message);
        return Promise.reject(new Error(message));
      }

      setIsUploading(true);
      setUploadProgress(0);
      setError("");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);
      if (uid) {
        formData.append("folder", `profilePhotos/${uid}`);
      }

      const uploadPromise = new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);
        xhr.timeout = UPLOAD_TIMEOUT_MS;

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setUploadProgress(Math.round((event.loaded / event.total) * 100));
          }
        };

        xhr.onload = () => {
          let body = null;
          try {
            body = JSON.parse(xhr.responseText);
          } catch {
            // Non-JSON response — body stays null, handled below.
          }

          if (xhr.status >= 200 && xhr.status < 300 && body?.secure_url) {
            setUploadProgress(100);
            resolve(body.secure_url);
          } else {
            reject(new Error(body?.error?.message || `Photo upload failed (HTTP ${xhr.status}).`));
          }
        };

        xhr.onerror = () =>
          reject(new Error("Photo upload failed. Please check your connection and try again."));

        xhr.ontimeout = () =>
          reject(
            new Error(
              `Photo upload timed out after ${UPLOAD_TIMEOUT_MS / 1000} seconds. Please check your connection and try again.`
            )
          );

        xhr.send(formData);
      });

      return uploadPromise
        .catch((uploadError) => {
          setError(uploadError?.message || "Photo upload failed. Please try again.");
          throw uploadError;
        })
        .finally(() => {
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
