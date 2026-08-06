import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { useCrisisImageUpload } from "../hooks/useCrisisImageUpload";
import {
  createCrisisReport,
  listMyCrisisReports,
  updateCrisisReportContent,
} from "../services/crisisReportsService";
import {
  CONTACT_METHODS,
  CRISIS_CATEGORIES,
  CRISIS_REPORT_STATUS_LABELS,
  CRISIS_URGENCY_LEVELS,
  crisisStatusBadgeSuffix,
} from "../services/crisisTypes";
import "./CrisisForms.css";

const EMPTY_FIELDS = {
  category: CRISIS_CATEGORIES[0],
  title: "",
  description: "",
  province: "",
  territory: "",
  cityVillage: "",
  approximateLocation: "",
  urgency: "low",
  peopleAffectedCount: 0,
  preferredContactMethod: CONTACT_METHODS[0],
  contactDetails: "",
  showIdentityPublicly: false,
  showLocationPublicly: false,
};

function ReportCrisis() {
  const [user, setUser] = useState(null);
  const [fields, setFields] = useState(EMPTY_FIELDS);
  const [editingId, setEditingId] = useState(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState("");
  const [myReports, setMyReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const photo = useCrisisImageUpload("reports");

  const loadMyReports = useCallback(async (uid) => {
    setLoadingReports(true);
    try {
      const data = await listMyCrisisReports(uid);
      setMyReports(data);
    } catch (err) {
      console.error("Failed to load your crisis reports:", err);
    } finally {
      setLoadingReports(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) loadMyReports(currentUser.uid);
      else setLoadingReports(false);
    });
    return () => unsubscribe();
  }, [loadMyReports]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFields((prev) => ({ ...prev, [name]: e.target.checked }));
    } else if (name === "peopleAffectedCount") {
      setFields((prev) => ({ ...prev, [name]: Math.max(0, parseInt(value, 10) || 0) }));
    } else {
      setFields((prev) => ({ ...prev, [name]: value }));
    }
  };

  const startEditing = (report) => {
    setEditingId(report.id);
    setExistingPhotoUrl(report.photoUrl || "");
    setFields({
      category: report.category || CRISIS_CATEGORIES[0],
      title: report.title || "",
      description: report.description || "",
      province: report.province || "",
      territory: report.territory || "",
      cityVillage: report.cityVillage || "",
      approximateLocation: report.approximateLocation || "",
      urgency: report.urgency || "low",
      peopleAffectedCount: report.peopleAffectedCount || 0,
      preferredContactMethod: report.preferredContactMethod || CONTACT_METHODS[0],
      contactDetails: report.contactDetails || "",
      showIdentityPublicly: !!report.showIdentityPublicly,
      showLocationPublicly: !!report.showLocationPublicly,
    });
    setSuccessMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingId(null);
    setExistingPhotoUrl("");
    setFields(EMPTY_FIELDS);
    photo.removeFile();
  };

  const validate = () => {
    if (!fields.title.trim()) return "Title is required.";
    if (!fields.description.trim()) return "Description is required.";
    if (!fields.province.trim()) return "Province is required.";
    return "";
  };

  const submit = async (submitForReview) => {
    setError("");
    setSuccessMessage("");
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!user) {
      alert("Please log in to report a crisis.");
      return;
    }

    setIsSubmitting(true);
    try {
      const photoUrl = photo.file ? await photo.uploadImage(user.uid) : existingPhotoUrl;
      const payload = { ...fields, photoUrl };

      if (editingId) {
        await updateCrisisReportContent(editingId, payload, { submit: submitForReview });
      } else {
        await createCrisisReport(user, payload, { submit: submitForReview });
      }

      setSuccessMessage(
        submitForReview
          ? "Report submitted for admin review. You'll be notified once it's reviewed."
          : "Draft saved below. You can continue editing it any time."
      );
      resetForm();
      await loadMyReports(user.uid);
    } catch (err) {
      console.error("Failed to save crisis report:", err);
      setError(err.message || "Couldn't save this report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <section className="register-section">
        <div className="register-header">
          <h1>Report a Crisis</h1>
          <p>Please log in to submit a crisis report.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>{editingId ? "Edit Crisis Report" : "Report a Crisis"}</h1>
        <p>
          Your report is private and reviewed by an admin before anything is made public. Your
          identity and exact location are never published unless you explicitly allow it below.
        </p>
      </div>

      {error && <p className="register-form__error" role="alert">{error}</p>}
      {successMessage && <p className="register-form__success" role="status">{successMessage}</p>}

      <form className="register-form crisisform" onSubmit={(e) => e.preventDefault()}>
        <label>
          <span>Category</span>
          <select name="category" value={fields.category} onChange={handleChange}>
            {CRISIS_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label>
          <span>Urgency</span>
          <select name="urgency" value={fields.urgency} onChange={handleChange}>
            {CRISIS_URGENCY_LEVELS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
          </select>
        </label>

        <label className="crisisform-full"><span>Title</span><input name="title" value={fields.title} onChange={handleChange} placeholder="Short summary of the situation" /></label>
        <label className="crisisform-full"><span>Description</span><textarea name="description" value={fields.description} onChange={handleChange} /></label>

        <label><span>Province</span><input name="province" value={fields.province} onChange={handleChange} /></label>
        <label><span>Territory</span><input name="territory" value={fields.territory} onChange={handleChange} /></label>

        <label><span>City / Village</span><input name="cityVillage" value={fields.cityVillage} onChange={handleChange} /></label>
        <label><span>Approximate Location</span><input name="approximateLocation" value={fields.approximateLocation} onChange={handleChange} placeholder="e.g. near the central market" /></label>

        <label><span>People Affected</span><input type="number" min="0" name="peopleAffectedCount" value={fields.peopleAffectedCount} onChange={handleChange} /></label>
        <label><span>Preferred Contact Method</span>
          <select name="preferredContactMethod" value={fields.preferredContactMethod} onChange={handleChange}>
            {CONTACT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>

        <label className="crisisform-full"><span>Contact Details (private, admin only)</span><input name="contactDetails" value={fields.contactDetails} onChange={handleChange} placeholder="Phone number or other way for an admin to reach you" /></label>

        <label className="crisisform-full">
          <span>Photo (optional, private — used for admin verification only, never published)</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => photo.selectFile(e.target.files[0])} />
          {photo.previewUrl && <img src={photo.previewUrl} alt="Preview" className="crisisform-image-preview" />}
          {photo.error && <p className="register-form__error" role="alert">{photo.error}</p>}
        </label>

        <label className="crisisform-full crisisform-checkbox">
          <input type="checkbox" name="showIdentityPublicly" checked={fields.showIdentityPublicly} onChange={handleChange} />
          <span>Show my name publicly if this report becomes a verified alert</span>
        </label>
        <label className="crisisform-full crisisform-checkbox">
          <input type="checkbox" name="showLocationPublicly" checked={fields.showLocationPublicly} onChange={handleChange} />
          <span>Show my general location (territory / city) publicly if verified — province is always shown</span>
        </label>

        <div className="crisisform-actions">
          <button type="button" onClick={() => submit(false)} disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save Draft"}
          </button>
          <button type="button" onClick={() => submit(true)} disabled={isSubmitting}>
            {isSubmitting ? "Submitting…" : "Submit for Review"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} disabled={isSubmitting}>Cancel Edit</button>
          )}
        </div>
      </form>

      <div className="crisisform-mylist">
        <h2>Your Crisis Reports</h2>
        {loadingReports ? (
          <p>Loading…</p>
        ) : myReports.length === 0 ? (
          <p>You haven't submitted any crisis reports yet.</p>
        ) : (
          myReports.map((report) => (
            <div className="crisisform-mylist-row" key={report.id}>
              <div className="crisisform-mylist-title">
                <strong>{report.title}</strong>
                <span className={`crisis-status-badge crisis-status-${crisisStatusBadgeSuffix(report.status)}`}>
                  {CRISIS_REPORT_STATUS_LABELS[report.status] || report.status}
                </span>
              </div>
              <p>{report.category} · {report.province}</p>
              {["rejected", "draft"].includes(report.status) && report.adminMessage && (
                <p className="crisisform-mylist-message">Admin: {report.adminMessage}</p>
              )}
              {["draft", "submitted"].includes(report.status) && (
                <div className="crisisform-mylist-actions">
                  <button type="button" onClick={() => startEditing(report)}>Edit</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default ReportCrisis;
