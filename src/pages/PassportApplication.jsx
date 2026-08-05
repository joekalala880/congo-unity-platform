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
import { APPLICATION_MODES, PASSPORT_DOCUMENT_TYPES, PASSPORT_TYPES } from "../services/serviceApplicationTypes";
// Reuses the Birth Certificate form's styles (same "bcapp-" prefixed dark
// step-card look) rather than duplicating an identical stylesheet.
import "./BirthCertificateApplication.css";

const STEPS = ["Applicant Info", "Passport & Emergency Contact", "Documents", "Review & Submit"];

const EMPTY_FIELDS = {
  applicantFullName: "",
  dateOfBirth: "",
  placeOfBirth: "",
  passportType: "ordinary",
  applicationMode: "new",
  currentPassportNumber: "",
  currentPassportIssueDate: "",
  currentPassportExpirationDate: "",
  reasonForRequest: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
};

function PassportApplication() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [applicationId, setApplicationId] = useState(null);
  const [loadedStatus, setLoadedStatus] = useState(null);
  const [fields, setFields] = useState(EMPTY_FIELDS);
  const [documents, setDocuments] = useState([]);
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

        const draftSnap = await getDocs(
          query(collection(db, "serviceApplications"), where("applicantUserId", "==", currentUser.uid))
        );
        const drafts = draftSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((a) => a.serviceType === "passport" && ["draft", "more_information_required"].includes(a.status))
          .sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0));

        if (drafts.length > 0) {
          const draft = drafts[0];
          setApplicationId(draft.id);
          setLoadedStatus(draft.status);
          setFields({
            applicantFullName: draft.applicantFullName || "",
            dateOfBirth: draft.dateOfBirth || "",
            placeOfBirth: draft.placeOfBirth || "",
            passportType: draft.passportType || "ordinary",
            applicationMode: draft.applicationMode || "new",
            currentPassportNumber: draft.currentPassportNumber || "",
            currentPassportIssueDate: draft.currentPassportIssueDate || "",
            currentPassportExpirationDate: draft.currentPassportExpirationDate || "",
            reasonForRequest: draft.reasonForRequest || "",
            emergencyContactName: draft.emergencyContactName || "",
            emergencyContactPhone: draft.emergencyContactPhone || "",
          });
          setDocuments(draft.supportingDocuments || []);
        } else if (loadedProfile) {
          setFields((prev) => ({
            ...prev,
            applicantFullName: `${loadedProfile.firstName || ""} ${loadedProfile.lastName || ""}`.trim(),
            dateOfBirth: loadedProfile.dateOfBirth || "",
            placeOfBirth: loadedProfile.placeOfBirth || "",
            emergencyContactName: loadedProfile.emergencyContact || "",
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

  const isRenewal = fields.applicationMode === "renewal";
  // A passport is a higher-stakes document than a birth certificate record,
  // so unlike the birth-cert flow (which only needs a citizenId to exist),
  // this requires a fully verified Digital Identity plus a profile photo —
  // both are "required documents" per spec, sourced from the profile
  // rather than collected as a new upload here.
  const identityReady = profile?.status === "verified" && !!profile?.profileImageUrl;

  const ensureDraftExists = async () => {
    if (applicationId) return applicationId;
    if (!profile?.citizenId) {
      throw new Error("Your Digital ID hasn't finished setting up yet. Visit My Profile first.");
    }
    const id = await createDraft(user, profile, "passport", { ...fields, supportingDocuments: documents });
    setApplicationId(id);
    return id;
  };

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
      const { publicId, resourceType } = await idDoc.uploadDocument(idToken, "passport");

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

  const hasRequiredDocument =
    documents.some((d) => d.documentType === "national_id_or_birth_cert") &&
    (!isRenewal || documents.some((d) => d.documentType === "existing_passport"));

  const missingDocumentMessage = isRenewal
    ? "National ID/Birth Certificate and your existing passport are required before continuing."
    : "National ID or Birth Certificate is required before continuing.";

  const goNext = () => {
    setError("");

    if (step === 1 && !fields.applicantFullName.trim()) {
      setError("Full name is required.");
      return;
    }

    if (step === 2 && isRenewal && !fields.currentPassportNumber.trim()) {
      setError("Current passport number is required for a renewal.");
      return;
    }

    if (step === 3 && !hasRequiredDocument) {
      setError(missingDocumentMessage);
      return;
    }

    setStep((s) => Math.min(s + 1, 4));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    setError("");

    if (!hasRequiredDocument) {
      setError(missingDocumentMessage);
      return;
    }

    const confirmMessage = loadedStatus === "more_information_required"
      ? "Resubmit this application for review?"
      : "Submit this passport application for review?";
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
          <h1>Passport Application / Renewal</h1>
          <p>Please log in to start an application.</p>
        </div>
      </section>
    );
  }

  if (!identityReady) {
    return (
      <section className="register-section">
        <div className="register-header">
          <h1>Passport Application / Renewal</h1>
          <p>A Congo Unity Platform request workflow — not an official DRC-issued passport.</p>
        </div>
        <div className="bcapp-form-card">
          <h3>Verified Digital Identity Required</h3>
          <p className="bcapp-hint">
            A passport application requires a verified Digital Identity and a profile photo on
            file. Visit My Profile to complete verification and add a photo before applying.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>Passport Application / Renewal</h1>
        <p>A Congo Unity Platform request workflow — Congo Unity does not currently issue an official DRC passport.</p>
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
          <h3>Passport & Emergency Contact</h3>
          <div className="bcapp-form-grid">
            <label>
              <span>Passport Type</span>
              <select name="passportType" value={fields.passportType} onChange={handleChange}>
                {PASSPORT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Application Type</span>
              <select name="applicationMode" value={fields.applicationMode} onChange={handleChange}>
                {APPLICATION_MODES.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </label>

            {isRenewal && (
              <>
                <label>
                  <span>Current Passport Number</span>
                  <input name="currentPassportNumber" value={fields.currentPassportNumber} onChange={handleChange} />
                </label>
                <label>
                  <span>Current Passport Issue Date</span>
                  <input name="currentPassportIssueDate" type="date" value={fields.currentPassportIssueDate} onChange={handleChange} />
                </label>
                <label>
                  <span>Current Passport Expiration Date</span>
                  <input name="currentPassportExpirationDate" type="date" value={fields.currentPassportExpirationDate} onChange={handleChange} />
                </label>
              </>
            )}

            <label className="bcapp-full-width">
              <span>{isRenewal ? "Reason for Renewal" : "Reason for Application"}</span>
              <textarea name="reasonForRequest" value={fields.reasonForRequest} onChange={handleChange} />
            </label>
            <label>
              <span>Emergency Contact Name</span>
              <input name="emergencyContactName" value={fields.emergencyContactName} onChange={handleChange} />
            </label>
            <label>
              <span>Emergency Contact Phone</span>
              <input name="emergencyContactPhone" value={fields.emergencyContactPhone} onChange={handleChange} />
            </label>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="bcapp-form-card">
          <h3>Supporting Documents</h3>

          {PASSPORT_DOCUMENT_TYPES.map((docType) => {
            if (docType.value === "existing_passport" && !isRenewal) return null;
            const isRequired = docType.value === "national_id_or_birth_cert" || (docType.value === "existing_passport" && isRenewal);
            const uploaded = documents.find((d) => d.documentType === docType.value);

            return (
              <div className="bcapp-doc-row" key={docType.value}>
                <div className="bcapp-doc-label">
                  <strong>{docType.label}</strong>
                  {isRequired && <span className="bcapp-required">Required</span>}
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
            <div><dt>Passport Type</dt><dd>{PASSPORT_TYPES.find((t) => t.value === fields.passportType)?.label}</dd></div>
            <div><dt>Application Type</dt><dd>{APPLICATION_MODES.find((m) => m.value === fields.applicationMode)?.label}</dd></div>
            {isRenewal && <div><dt>Current Passport #</dt><dd>{fields.currentPassportNumber || "—"}</dd></div>}
            <div><dt>Reason</dt><dd>{fields.reasonForRequest || "—"}</dd></div>
            <div><dt>Emergency Contact</dt><dd>{fields.emergencyContactName || "—"} {fields.emergencyContactPhone ? `(${fields.emergencyContactPhone})` : ""}</dd></div>
            <div><dt>Documents</dt><dd>{documents.length} uploaded</dd></div>
          </dl>

          <p className="bcapp-legal-note">
            By submitting, you confirm this information is accurate. This creates a Congo Unity
            Platform request — Congo Unity does not currently issue an official DRC passport.
            Approval means approved within this platform's review process only.
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

export default PassportApplication;
