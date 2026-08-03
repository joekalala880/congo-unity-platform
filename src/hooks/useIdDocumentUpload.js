import { useCallback, useState } from "react";

// Identity-document upload for UploadID.jsx. Kept separate from
// useProfilePhotoUpload: validation differs (PDFs are allowed, size cap is
// larger), and — critically — the upload itself must be signed rather than
// posted to an unsigned preset. A leaked profile-photo URL is a non-issue;
// a leaked passport scan is not, so these documents are uploaded to
// Cloudinary with type: "authenticated" using a signature minted per-request
// by the /api/cloudinary-sign backend (which verifies the caller's Firebase
// session first). See api/cloudinary-sign.js for the server side of this.
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const UPLOAD_TIMEOUT_MS = 30000;

const SIGNING_ENDPOINT = import.meta.env.VITE_ID_DOCUMENT_SIGNING_ENDPOINT;

export function useIdDocumentUpload() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const selectFile = useCallback((selected) => {
    if (!selected) {
      setFile(null);
      setError("");
      return;
    }

    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setError("Please choose a JPG, PNG, WEBP, or PDF file.");
      return;
    }

    if (selected.size > MAX_SIZE_BYTES) {
      setError("File must be 10 MB or smaller.");
      return;
    }

    setError("");
    setFile(selected);
  }, []);

  const removeFile = useCallback(() => {
    setFile(null);
    setError("");
    setUploadProgress(0);
  }, []);

  const uploadDocument = useCallback(
    async (idToken) => {
      if (!file) {
        const message = "Please choose a file first.";
        setError(message);
        throw new Error(message);
      }

      if (!SIGNING_ENDPOINT) {
        const message = "Document upload isn't configured yet (missing signing endpoint).";
        setError(message);
        throw new Error(message);
      }

      setIsUploading(true);
      setUploadProgress(0);
      setError("");

      try {
        let signResponse;
        try {
          signResponse = await fetch(SIGNING_ENDPOINT, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({ action: "upload" }),
          });
        } catch {
          throw new Error("Could not reach the upload service. Please check your connection and try again.");
        }

        const signBody = await signResponse.json().catch(() => null);

        if (!signResponse.ok) {
          throw new Error(signBody?.error || "Could not authorize the upload. Please try again.");
        }

        const { cloudName, apiKey, timestamp, folder, type, signature } = signBody;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", apiKey);
        formData.append("timestamp", timestamp);
        formData.append("signature", signature);
        formData.append("folder", folder);
        formData.append("type", type);

        const uploadResult = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`);
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

            if (xhr.status >= 200 && xhr.status < 300 && body?.public_id) {
              setUploadProgress(100);
              resolve({
                publicId: body.public_id,
                resourceType: body.resource_type,
                secureUrl: body.secure_url,
              });
            } else {
              reject(new Error(body?.error?.message || `Document upload failed (HTTP ${xhr.status}).`));
            }
          };

          xhr.onerror = () =>
            reject(new Error("Document upload failed. Please check your connection and try again."));

          xhr.ontimeout = () =>
            reject(
              new Error(
                `Document upload timed out after ${UPLOAD_TIMEOUT_MS / 1000} seconds. Please try again.`
              )
            );

          xhr.send(formData);
        });

        return uploadResult;
      } catch (uploadError) {
        setError(uploadError?.message || "Document upload failed. Please try again.");
        throw uploadError;
      } finally {
        setIsUploading(false);
      }
    },
    [file]
  );

  return {
    file,
    error,
    isUploading,
    uploadProgress,
    selectFile,
    removeFile,
    uploadDocument,
  };
}
