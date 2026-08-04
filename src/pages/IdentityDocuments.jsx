import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useIdDocumentUpload } from "../hooks/useIdDocumentUpload";
import {
  deleteDraft,
  listMyDocuments,
  replaceDocument,
  respondToMoreInfo,
  saveDraft,
  submitDraft,
  submitNewDocument,
  updateDraft,
} from "../services/identityDocumentsService";
import { DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS, STATUS_LABELS, statusBadgeClass } from "../services/identityDocumentTypes";
import "./IdentityDocuments.css";

function formatDate(value) {
  if (!value) return "—";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function RowSkeleton() {
  return (
    <div className="iddoc-row">
      <div className="iddoc-skeleton" style={{ width: "40%", height: 16 }} />
      <div className="iddoc-skeleton" style={{ width: "70%", height: 12, marginTop: 8 }} />
    </div>
  );
}

const EMPTY_FORM = {
  documentType: "",
  documentNumber: "",
  issuingCountry: "",
  issueDate: "",
  expirationDate: "",
};

function IdentityDocuments() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // formMode: null | 'new' | { mode: 'edit', docId } | { mode: 'replace', docId }
  const [formMode, setFormMode] = useState(null);
  const [formFields, setFormFields] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [respondingId, setRespondingId] = useState(null);
  const [responseText, setResponseText] = useState("");
  const [busyId, setBusyId] = useState(null);

  const idDoc = useIdDocumentUpload();
  const previewUrlRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) return;

      const q = query(collection(db, "congoleseProfiles"), where("email", "==", currentUser.email));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        setProfile(snapshot.docs[0].data());
      }
    });

    return () => unsubscribe();
  }, []);

  const refreshDocuments = async (uid) => {
    setLoading(true);
    setError("");

    try {
      const docs = await listMyDocuments(uid);
      setDocuments(docs);
    } catch (err) {
      console.error("Failed to load identity documents:", err);
      setError("We couldn't load your documents right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      if (user) await refreshDocuments(user.uid);
    })();
  }, [user]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 4000);
  };

  const handleFileSelected = (file) => {
    idDoc.selectFile(file);

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    if (file && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      previewUrlRef.current = url;
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const closeForm = () => {
    setFormMode(null);
    setFormFields(EMPTY_FORM);
    idDoc.removeFile();
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null);
    setError("");
  };

  const openNewForm = () => {
    setFormFields(EMPTY_FORM);
    setFormMode("new");
  };

  const openEditForm = (docItem) => {
    setFormFields({
      documentType: docItem.documentType,
      documentNumber: docItem.documentNumber || "",
      issuingCountry: docItem.issuingCountry || "",
      issueDate: docItem.issueDate || "",
      expirationDate: docItem.expirationDate || "",
    });
    setFormMode({ mode: "edit", docId: docItem.id, existing: docItem });
  };

  const openReplaceForm = (docItem) => {
    setFormFields({
      documentType: docItem.documentType,
      documentNumber: docItem.documentNumber || "",
      issuingCountry: docItem.issuingCountry || "",
      issueDate: docItem.issueDate || "",
      expirationDate: docItem.expirationDate || "",
    });
    setFormMode({ mode: "replace", docId: docItem.id });
  };

  const handleFormChange = (e) => {
    setFormFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const uploadIfNeeded = async () => {
    if (!idDoc.file) return null;
    const idToken = await user.getIdToken();
    const { publicId, resourceType } = await idDoc.uploadDocument(idToken);
    return { cloudinaryPublicId: publicId, resourceType, fileType: idDoc.file.type, fileSize: idDoc.file.size };
  };

  const handleSave = async (targetStatus) => {
    setError("");

    if (!formFields.documentType) {
      setError("Please choose a document type.");
      return;
    }

    const isEdit = formMode?.mode === "edit";
    const isReplace = formMode?.mode === "replace";

    if ((formMode === "new" || isReplace) && !idDoc.file) {
      setError("Please choose a file.");
      return;
    }

    setIsSaving(true);

    try {
      const uploadResult = await uploadIfNeeded();

      if (formMode === "new") {
        const payload = { ...formFields, ...uploadResult };
        if (targetStatus === "draft") {
          await saveDraft(user, profile, payload);
          showSuccess("Document saved as a draft.");
        } else {
          await submitNewDocument(user, profile, payload);
          showSuccess("Document submitted for verification.");
        }
      } else if (isEdit) {
        const existing = formMode.existing;
        const payload = {
          ...formFields,
          cloudinaryPublicId: uploadResult?.cloudinaryPublicId || existing.cloudinaryPublicId,
          resourceType: uploadResult?.resourceType || existing.resourceType,
          fileType: uploadResult?.fileType || existing.fileType,
          fileSize: uploadResult?.fileSize || existing.fileSize,
        };
        await updateDraft(formMode.docId, payload);
        if (targetStatus === "submitted") {
          await submitDraft(user, formMode.docId, formFields.documentType);
          showSuccess("Document submitted for verification.");
        } else {
          showSuccess("Draft updated.");
        }
      } else if (isReplace) {
        const payload = { ...formFields, ...uploadResult };
        await replaceDocument(user, profile, formMode.docId, payload);
        showSuccess("Replacement submitted for verification.");
      }

      closeForm();
      await refreshDocuments(user.uid);
    } catch (err) {
      console.error("Failed to save document:", err);
      setError(err?.message || "Couldn't save this document. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitDraft = async (docItem) => {
    setBusyId(docItem.id);
    setError("");

    try {
      await submitDraft(user, docItem.id, docItem.documentType);
      showSuccess("Document submitted for verification.");
      await refreshDocuments(user.uid);
    } catch (err) {
      console.error("Failed to submit draft:", err);
      setError("Couldn't submit this document. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (docItem) => {
    if (!window.confirm(`Delete this ${DOCUMENT_TYPE_LABELS[docItem.documentType] || docItem.documentType} draft? This can't be undone.`)) {
      return;
    }

    setBusyId(docItem.id);
    setError("");

    try {
      await deleteDraft(user, docItem.id, docItem.documentType);
      showSuccess("Draft deleted.");
      await refreshDocuments(user.uid);
    } catch (err) {
      console.error("Failed to delete draft:", err);
      setError("Couldn't delete this draft. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const openRespondForm = (docItem) => {
    setRespondingId(docItem.id);
    setResponseText("");
  };

  const handleRespond = async (docItem) => {
    if (!responseText.trim()) {
      setError("Please enter a response before submitting.");
      return;
    }

    setBusyId(docItem.id);
    setError("");

    try {
      await respondToMoreInfo(user, docItem.id, responseText.trim());
      showSuccess("Your response was submitted for review.");
      setRespondingId(null);
      setResponseText("");
      await refreshDocuments(user.uid);
    } catch (err) {
      console.error("Failed to respond:", err);
      setError("Couldn't submit your response. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const missingCitizenId = user && profile && !profile.citizenId;

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>Identity Documents</h1>
        <p>Submit and manage the documents used to verify your Congo Unity identity.</p>
      </div>

      {successMessage && <p className="register-form__success" role="status">{successMessage}</p>}
      {error && <p className="register-form__error" role="alert">{error}</p>}

      {missingCitizenId && (
        <p className="register-form__error" role="alert">
          Your Digital ID hasn't finished setting up yet. Visit <Link to="/profile">My Profile</Link> first, then come back here.
        </p>
      )}

      {!formMode && !missingCitizenId && (
        <button type="button" className="iddoc-add-button" onClick={openNewForm}>
          + Add Document
        </button>
      )}

      {formMode && (
        <div className="iddoc-form-card">
          <h3>
            {formMode === "new" && "Add a Document"}
            {formMode?.mode === "edit" && "Edit Draft"}
            {formMode?.mode === "replace" && "Replace Document"}
          </h3>

          <div className="iddoc-form-grid">
            <select name="documentType" value={formFields.documentType} onChange={handleFormChange} aria-label="Document type">
              <option value="">Document Type</option>
              {DOCUMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>

            <input
              name="documentNumber"
              value={formFields.documentNumber}
              onChange={handleFormChange}
              placeholder="Document Number (optional)"
            />

            <input
              name="issuingCountry"
              value={formFields.issuingCountry}
              onChange={handleFormChange}
              placeholder="Issuing Country"
            />

            <label className="iddoc-date-field">
              <span>Issue Date</span>
              <input name="issueDate" type="date" value={formFields.issueDate} onChange={handleFormChange} />
            </label>

            <label className="iddoc-date-field">
              <span>Expiration Date</span>
              <input name="expirationDate" type="date" value={formFields.expirationDate} onChange={handleFormChange} />
            </label>
          </div>

          <div className="iddoc-file-field">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => handleFileSelected(e.target.files[0])}
              disabled={isSaving}
              aria-label="Choose file"
            />

            {formMode?.mode === "edit" && !idDoc.file && (
              <p className="iddoc-file-hint">Leave empty to keep the currently uploaded file.</p>
            )}

            {previewUrl && <img src={previewUrl} alt="Document preview" className="iddoc-preview" />}
            {idDoc.file && !previewUrl && <p className="iddoc-file-hint">Selected: {idDoc.file.name}</p>}

            {idDoc.file && (
              <button type="button" className="iddoc-remove-file" onClick={() => handleFileSelected(null)} disabled={isSaving}>
                Remove selected file
              </button>
            )}

            {idDoc.isUploading && <p className="iddoc-file-hint">Uploading… {idDoc.uploadProgress}%</p>}
            {idDoc.error && <p className="register-form__error" role="alert">{idDoc.error}</p>}
          </div>

          <div className="iddoc-form-actions">
            <button type="button" onClick={closeForm} disabled={isSaving}>Cancel</button>

            {formMode === "new" && (
              <>
                <button type="button" onClick={() => handleSave("draft")} disabled={isSaving}>
                  {isSaving ? "Saving…" : "Save Draft"}
                </button>
                <button type="button" onClick={() => handleSave("submitted")} disabled={isSaving}>
                  {isSaving ? "Submitting…" : "Submit for Verification"}
                </button>
              </>
            )}

            {formMode?.mode === "edit" && (
              <>
                <button type="button" onClick={() => handleSave("draft")} disabled={isSaving}>
                  {isSaving ? "Saving…" : "Save Changes"}
                </button>
                <button type="button" onClick={() => handleSave("submitted")} disabled={isSaving}>
                  {isSaving ? "Submitting…" : "Save & Submit"}
                </button>
              </>
            )}

            {formMode?.mode === "replace" && (
              <button type="button" onClick={() => handleSave("submitted")} disabled={isSaving}>
                {isSaving ? "Submitting…" : "Submit Replacement"}
              </button>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="iddoc-list">
          <RowSkeleton />
          <RowSkeleton />
        </div>
      ) : documents.length === 0 ? (
        <div className="iddoc-empty">
          <p>No documents submitted yet.</p>
        </div>
      ) : (
        <div className="iddoc-list">
          {documents.map((docItem) => (
            <div className="iddoc-row" key={docItem.id}>
              <div className="iddoc-row-title">
                <strong>{DOCUMENT_TYPE_LABELS[docItem.documentType] || docItem.documentType}</strong>
                <span className={`iddoc-badge ${statusBadgeClass(docItem.status)}`}>
                  {STATUS_LABELS[docItem.status] || docItem.status}
                </span>
              </div>

              <p className="iddoc-row-meta">
                Submitted {formatDate(docItem.submittedAt)}
                {docItem.expirationDate && ` · Expires ${docItem.expirationDate}`}
              </p>

              {docItem.status === "rejected" && docItem.rejectionReason && (
                <p className="iddoc-reason">Reason: {docItem.rejectionReason}</p>
              )}

              {docItem.status === "more_information_required" && docItem.requestMoreInfoMessage && (
                <p className="iddoc-reason">Admin requested: {docItem.requestMoreInfoMessage}</p>
              )}

              {docItem.status === "more_information_required" && respondingId === docItem.id && (
                <div className="iddoc-respond-box">
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Type your response…"
                    aria-label="Response to admin"
                  />
                  <div className="iddoc-form-actions">
                    <button type="button" onClick={() => setRespondingId(null)} disabled={busyId === docItem.id}>Cancel</button>
                    <button type="button" onClick={() => handleRespond(docItem)} disabled={busyId === docItem.id}>
                      {busyId === docItem.id ? "Submitting…" : "Submit Response"}
                    </button>
                  </div>
                </div>
              )}

              <div className="iddoc-row-actions">
                {docItem.status === "draft" && (
                  <>
                    <button type="button" onClick={() => openEditForm(docItem)} disabled={busyId === docItem.id || !!formMode}>Edit</button>
                    <button type="button" onClick={() => handleSubmitDraft(docItem)} disabled={busyId === docItem.id || !!formMode}>
                      {busyId === docItem.id ? "Submitting…" : "Submit"}
                    </button>
                    <button type="button" className="iddoc-delete-button" onClick={() => handleDelete(docItem)} disabled={busyId === docItem.id || !!formMode}>
                      Delete
                    </button>
                  </>
                )}

                {docItem.status === "rejected" && (
                  <button type="button" onClick={() => openReplaceForm(docItem)} disabled={!!formMode}>Replace</button>
                )}

                {docItem.status === "more_information_required" && respondingId !== docItem.id && (
                  <>
                    <button type="button" onClick={() => openRespondForm(docItem)} disabled={!!formMode}>Respond</button>
                    <button type="button" onClick={() => openReplaceForm(docItem)} disabled={!!formMode}>Replace</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default IdentityDocuments;
