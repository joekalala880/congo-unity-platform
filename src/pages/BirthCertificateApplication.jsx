import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useIdDocumentUpload } from "../hooks/useIdDocumentUpload";
import {
  createDraft,
  respondToMoreInfo,
  saveDraftFields,
  submitApplication,
} from "../services/serviceApplicationsService";
import { BIRTH_CERT_DOCUMENT_TYPES, DELIVERY_PREFERENCES } from "../services/serviceApplicationTypes";
import "./BirthCertificateApplication.css";

const STEPS = ["Applicant Info", "Birth & Parent Info", "Documents", "Review & Submit"];

const EMPTY_FIELDS = {
  applicantFullName: "",
  dateOfBirth: "",
  placeOfBirth: "",
  provinceOfBirth: "",
  territoryOfBirth: "",
  fatherFullName: "",
  motherFullName: "",
  reasonForRequest: "",
  deliveryPreference: "digital",
};

function BirthCertificateApplication() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [applicationId, setApplicationId] = useState(null);
  const [loadedStatus, setLoadedStatus] = useState(null);
  const [fields, setFields] = useState(EMPTY_FIELDS);
  const [documents, setDocuments] = useState([]); // uploaded docs, by documentType
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [activeUploadType, setActiveUploadType] = useState(null);
  const idDoc = useIdDocumentUpload();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const profileSnap = await getDocs(
          query(collection(db, "congoleseProfiles"), where("email", "==", currentUser.email))
        );

        let loadedProfile = null;
        if (!profileSnap.empty) {
          loadedProfile = profileSnap.docs[0].data();
          setProfile(loadedProfile);
        }

        // Resume the most recent editable application, if one exists —
        // either a draft ("Continue Later") or one an admin sent back for
        // more information (the same multi-step form doubles as the
        // "respond" flow for that state).
        const draftSnap = await getDocs(
          query(
            collection(db, "serviceApplications"),
            where("applicantUserId", "==", currentUser.uid)
          )
        );
        const drafts = draftSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((a) => a.serviceType === "birth_certificate" && ["draft", "more_information_required"].includes(a.status))
          .sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0));

        if (drafts.length > 0) {
          const draft = drafts[0];
          setApplicationId(draft.id);
          setLoadedStatus(draft.status);
          setFields({
            applicantFullName: draft.applicantFullName || "",
            dateOfBirth: draft.dateOfBirth || "",
            placeOfBirth: draft.placeOfBirth || "",
            provinceOfBirth: draft.provinceOfBirth || "",
            territoryOfBirth: draft.territoryOfBirth || "",
            fatherFullName: draft.fatherFullName || "",
            motherFullName: draft.motherFullName || "",
            reasonForRequest: draft.reasonForRequest || "",
            deliveryPreference: draft.deliveryPreference || "digital",
          });
          setDocuments(draft.supportingDocuments || []);
        } else if (loadedProfile) {
          setFields((prev) => ({
            ...prev,
            applicantFullName: `${loadedProfile.firstName || ""} ${loadedProfile.lastName || ""}`.trim(),
            dateOfBirth: loadedProfile.dateOfBirth || "",
            placeOfBirth: loadedProfile.placeOfBirth || "",
            provinceOfBirth: loadedProfile.province || "",
            territoryOfBirth: loadedProfile.territory || "",
          }));
        }
      } catch (err) {
        console.error("Failed to load application:", err);
        setError("We couldn't load your application. Please try again.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const ensureDraftExists = async () => {
    if (applicationId) return applicationId;
    if (!profile?.citizenId) {
      throw new Error("Your Digital ID hasn't finished setting up yet. Visit My Profile first.");
    }
    const id = await createDraft(user, profile, { ...fields, supportingDocuments: documents });
    setApplicationId(id);
    return id;
  };

  // Not available once an admin has sent this back for more information —
  // firestore.rules only allows that state to move forward to 'submitted'
  // in one step, not stay in place while edits are saved separately.
  const canSaveDraft = loadedStatus !== "more_information_required";

  const handleSaveDraft = async () => {
    setError("");
    setIsSaving(true);

    try {
      const id = await ensureDraftExists();
      await saveDraftFields(id, { ...fields, supportingDocuments: documents });
      setSuccessMessage("Draft saved. You can continue later.");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      console.error("Failed to save draft:", err);
      setError(err.message || "Couldn't save your draft. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadDocument = async (documentType, file) => {
    setError("");
    idDoc.selectFile(file);
    setActiveUploadType(documentType);
  };

  const confirmUpload = async (documentType) => {
    if (!idDoc.file || !user) return;
    setError("");

    try {
      const idToken = await user.getIdToken();
      const { publicId, resourceType } = await idDoc.uploadDocument(idToken, "birthCertificate");

      const newDoc = {
        documentType,
        cloudinaryPublicId: publicId,
        resourceType,
        fileType: idDoc.file.type,
        fileSize: idDoc.file.size,
        fileName: idDoc.file.name,
        uploadedAt: new Date(),
      };

      setDocuments((prev) => [...prev.filter((d) => d.documentType !== documentType), newDoc]);
      idDoc.removeFile();
      setActiveUploadType(null);
    } catch (err) {
      console.error("Failed to upload document:", err);
      setError(err.message || "Document upload failed. Please try again.");
    }
  };

  const removeDocument = (documentType) => {
    setDocuments((prev) => prev.filter((d) => d.documentType !== documentType));
  };

  const hasRequiredDocument = documents.some((d) => d.documentType === "applicant_id");

  const goNext = () => {
    setError("");

    if (step === 1 && !fields.applicantFullName.trim()) {
      setError("Full name is required.");
      return;
    }

    if (step === 3 && !hasRequiredDocument) {
      setError("Applicant identification is required before continuing.");
      return;
    }

    setStep((s) => Math.min(s + 1, 4));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    setError("");

    if (!hasRequiredDocument) {
      setError("Applicant identification is required before submitting.");
      return;
    }

    const confirmMessage = loadedStatus === "more_information_required"
      ? "Resubmit this application for review?"
      : "Submit this birth certificate request for review?";
    if (!window.confirm(confirmMessage)) return;

    setIsSaving(true);

    try {
      const id = await ensureDraftExists();
      if (loadedStatus === "more_information_required") {
        await respondToMoreInfo(user, id, { ...fields, supportingDocuments: documents });
      } else {
        await submitApplication(user, id, { ...fields, supportingDocuments: documents });
      }
      navigate(`/government/applications/${id}`);
    } catch (err) {
      console.error("Failed to submit application:", err);
      setError(err.message || "Couldn't submit your application. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="register-section">
        <p className="bcapp-loading">Loading…</p>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="register-section">
        <div className="register-header">
          <h1>Birth Certificate Request</h1>
          <p>Please log in to start an application.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>Birth Certificate Request</h1>
        <p>A Congo Unity Platform request workflow — not an official DRC government-issued certificate.</p>
      </div>

      <div className="bcapp-steps" role="list" aria-label="Application progress">
        {STEPS.map((label, i) => (
          <div key={label} role="listitem" className={`bcapp-step ${step === i + 1 ? "bcapp-step-active" : ""} ${step > i + 1 ? "bcapp-step-done" : ""}`}>
            <span className="bcapp-step-num">{step > i + 1 ? "✓" : i + 1}</span>
            <span>{label}</span>
          </div>
        ))}
      </div>

      {successMessage && <p className="register-form__success" role="status">{successMessage}</p>}
      {error && <p className="register-form__error" role="alert">{error}</p>}

      {step === 1 && (
        <div className="bcapp-form-card">
          <h3>Applicant Information</h3>
          <p className="bcapp-hint">Prefilled from your verified Digital Identity where available.</p>

          <div className="bcapp-form-grid">
            <label>
              <span>Full Name</span>
              <input name="applicantFullName" value={fields.applicantFullName} onChange={handleChange} />
            </label>
            <label>
              <span>Date of Birth</span>
              <input name="dateOfBirth" type="date" value={fields.dateOfBirth} onChange={handleChange} />
            </label>
            <label>
              <span>Place of Birth</span>
              <input name="placeOfBirth" value={fields.placeOfBirth} onChange={handleChange} />
            </label>
            <label>
              <span>Citizen ID</span>
              <input value={profile?.citizenId || "Not yet issued"} disabled />
            </label>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="bcapp-form-card">
          <h3>Birth & Parent Information</h3>
          <div className="bcapp-form-grid">
            <label>
              <span>Province of Birth</span>
              <input name="provinceOfBirth" value={fields.provinceOfBirth} onChange={handleChange} />
            </label>
            <label>
              <span>Territory of Birth</span>
              <input name="territoryOfBirth" value={fields.territoryOfBirth} onChange={handleChange} />
            </label>
            <label>
              <span>Father's Full Name</span>
              <input name="fatherFullName" value={fields.fatherFullName} onChange={handleChange} />
            </label>
            <label>
              <span>Mother's Full Name</span>
              <input name="motherFullName" value={fields.motherFullName} onChange={handleChange} />
            </label>
            <label className="bcapp-full-width">
              <span>Reason for Request</span>
              <textarea name="reasonForRequest" value={fields.reasonForRequest} onChange={handleChange} />
            </label>
            <label>
              <span>Delivery Preference</span>
              <select name="deliveryPreference" value={fields.deliveryPreference} onChange={handleChange}>
                {DELIVERY_PREFERENCES.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="bcapp-form-card">
          <h3>Supporting Documents</h3>

          {BIRTH_CERT_DOCUMENT_TYPES.map((docType) => {
            const uploaded = documents.find((d) => d.documentType === docType.value);

            return (
              <div className="bcapp-doc-row" key={docType.value}>
                <div className="bcapp-doc-label">
                  <strong>{docType.label}</strong>
                  {docType.required && <span className="bcapp-required">Required</span>}
                </div>

                {uploaded ? (
                  <div className="bcapp-doc-uploaded">
                    <span>✓ {uploaded.fileName}</span>
                    <button type="button" onClick={() => removeDocument(docType.value)}>Remove</button>
                  </div>
                ) : (
                  <div className="bcapp-doc-upload">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      aria-label={`Upload ${docType.label}`}
                      onChange={(e) => handleUploadDocument(docType.value, e.target.files[0])}
                    />
                    {activeUploadType === docType.value && idDoc.file && (
                      <button type="button" onClick={() => confirmUpload(docType.value)} disabled={idDoc.isUploading}>
                        {idDoc.isUploading ? `Uploading… ${idDoc.uploadProgress}%` : "Confirm Upload"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {idDoc.error && <p className="register-form__error" role="alert">{idDoc.error}</p>}
        </div>
      )}

      {step === 4 && (
        <div className="bcapp-form-card">
          <h3>Review Before Submitting</h3>

          <dl className="bcapp-review">
            <div><dt>Full Name</dt><dd>{fields.applicantFullName || "—"}</dd></div>
            <div><dt>Date of Birth</dt><dd>{fields.dateOfBirth || "—"}</dd></div>
            <div><dt>Place of Birth</dt><dd>{fields.placeOfBirth || "—"}</dd></div>
            <div><dt>Province of Birth</dt><dd>{fields.provinceOfBirth || "—"}</dd></div>
            <div><dt>Territory of Birth</dt><dd>{fields.territoryOfBirth || "—"}</dd></div>
            <div><dt>Father's Name</dt><dd>{fields.fatherFullName || "—"}</dd></div>
            <div><dt>Mother's Name</dt><dd>{fields.motherFullName || "—"}</dd></div>
            <div><dt>Reason</dt><dd>{fields.reasonForRequest || "—"}</dd></div>
            <div><dt>Delivery</dt><dd>{DELIVERY_PREFERENCES.find((d) => d.value === fields.deliveryPreference)?.label}</dd></div>
            <div><dt>Documents</dt><dd>{documents.length} uploaded</dd></div>
          </dl>

          <p className="bcapp-legal-note">
            By submitting, you confirm this information is accurate. This creates a Congo Unity
            Platform request — it does not issue an official DRC government document.
          </p>
        </div>
      )}

      <div className="bcapp-actions">
        {step > 1 && <button type="button" onClick={goBack} disabled={isSaving}>Back</button>}
        {canSaveDraft && (
          <button type="button" onClick={handleSaveDraft} disabled={isSaving}>
            {isSaving ? "Saving…" : "Save Draft"}
          </button>
        )}
        {step < 4 && <button type="button" onClick={goNext} disabled={isSaving}>Next</button>}
        {step === 4 && (
          <button type="button" onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? "Submitting…" : loadedStatus === "more_information_required" ? "Resubmit Application" : "Submit Application"}
          </button>
        )}
      </div>
    </section>
  );
}

export default BirthCertificateApplication;
