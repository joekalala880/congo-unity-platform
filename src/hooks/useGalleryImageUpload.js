import { useCallback, useEffect, useRef, useState } from "react";

// Gallery images are public content (same as profile photos), so this
// reuses the exact unsigned-Cloudinary pattern from useProfilePhotoUpload.js
// rather than the signed flow used for identity documents. Kept as its own
// hook (not a shared one) since the two callers save the result into
// different places and validate slightly different constraints — profile
// photos always replace a single fixed slot, gallery images are one of
// several optional media fields on a form.
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const UPLOAD_TIMEOUT_MS = 20000;

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export function useGalleryImageUpload() {
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

  // Resolves to "" if no file was ever selected, so the form can always
  // save the result straight into imageUrl without a null check.
  const uploadImage = useCallback(() => {
    if (!file) return Promise.resolve("");

    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      const message = "Image upload isn't configured yet (missing Cloudinary environment variables).";
      setError(message);
      return Promise.reject(new Error(message));
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("folder", "galleryItems");

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
          reject(new Error(body?.error?.message || `Image upload failed (HTTP ${xhr.status}).`));
        }
      };

      xhr.onerror = () =>
        reject(new Error("Image upload failed. Please check your connection and try again."));

      xhr.ontimeout = () =>
        reject(
          new Error(`Image upload timed out after ${UPLOAD_TIMEOUT_MS / 1000} seconds. Please try again.`)
        );

      xhr.send(formData);
    });

    return uploadPromise
      .catch((uploadError) => {
        setError(uploadError?.message || "Image upload failed. Please try again.");
        throw uploadError;
      })
      .finally(() => {
        setIsUploading(false);
      });
  }, [file]);

  return {
    file,
    previewUrl,
    error,
    isUploading,
    uploadProgress,
    selectFile,
    removeFile,
    uploadImage,
  };
}
