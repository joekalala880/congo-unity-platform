import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { useCrisisImageUpload } from "../hooks/useCrisisImageUpload";
import {
  createMissingPersonReport,
  listMyMissingPersonReports,
  updateMissingPersonContent,
} from "../services/missingPersonsService";
import {
  MISSING_PERSON_GENDERS,
  MISSING_PERSON_STATUS_LABELS,
  missingPersonStatusBadgeSuffix,
} from "../services/crisisTypes";
import "./CrisisForms.css";

const EMPTY_FIELDS = {
  name: "",
  approximateAge: "",
  gender: "Unknown",
  lastSeenDate: "",
  lastSeenLocation: "",
  clothingDescription: "",
  distinguishingFeatures: "",
  safeContactMethod: "",
};

function ReportMissingPerson() {
  const [user, setUser] = useState(null);
  const [fields, setFields] = useState(EMPTY_FIELDS);
  const [editingId, setEditingId] = useState(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState("");
  const [myCases, setMyCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const photo = useCrisisImageUpload("missing-persons");

  const loadMyCases = useCallback(async (uid) => {
    setLoadingCases(true);
    try {
      const data = await listMyMissingPersonReports(uid);
      setMyCases(data);
    } catch (err) {
      console.error("Failed to load your missing person cases:", err);
    } finally {
      setLoadingCases(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) loadMyCases(currentUser.uid);
      else setLoadingCases(false);
    });
    return () => unsubscribe();
  }, [loadMyCases]);

  const handleChange = (e) => {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const startEditing = (mpCase) => {
    setEditingId(mpCase.id);
    setExistingPhotoUrl(mpCase.photoUrl || "");
    setFields({
      name: mpCase.name || "",
      approximateAge: mpCase.approximateAge || "",
      gender: mpCase.gender || "Unknown",
      lastSeenDate: mpCase.lastSeenDate || "",
      lastSeenLocation: mpCase.lastSeenLocation || "",
      clothingDescription: mpCase.clothingDescription || "",
      distinguishingFeatures: mpCase.distinguishingFeatures || "",
      safeContactMethod: mpCase.safeContactMethod || "",
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
    if (!fields.name.trim()) return "Name is required.";
    if (!fields.lastSeenLocation.trim()) return "Last-seen location is required.";
    if (!fields.safeContactMethod.trim()) return "A safe contact method is required.";
    return "";
  };

  const submit = async () => {
    setError("");
    setSuccessMessage("");
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!user) {
      alert("Please log in to report a missing person.");
      return;
    }

    setIsSubmitting(true);
    try {
      const photoUrl = photo.file ? await photo.uploadImage(user.uid) : existingPhotoUrl;
      const payload = { ...fields, photoUrl };

      if (editingId) {
        await updateMissingPersonContent(editingId, payload);
        setSuccessMessage("Case updated. It remains under admin review before publication.");
      } else {
        await createMissingPersonReport(user, payload);
        setSuccessMessage("Case submitted for admin review. You'll be notified once it's reviewed.");
      }

      resetForm();
      await loadMyCases(user.uid);
    } catch (err) {
      console.error("Failed to save missing person case:", err);
      setError(err.message || "Couldn't save this case. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <section className="register-section">
        <div className="register-header">
          <h1>Report a Missing Person</h1>
          <p>Please log in to submit a missing person case.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>{editingId ? "Edit Missing Person Case" : "Report a Missing Person"}</h1>
        <p>
          Cases are reviewed by an admin before appearing publicly. Never include a precise home
          address, school, or private contact details — the safe contact method you provide below
          may be shown publicly so others can report sightings.
        </p>
      </div>

      {error && <p className="register-form__error" role="alert">{error}</p>}
      {successMessage && <p className="register-form__success" role="status">{successMessage}</p>}

      <form className="register-form crisisform" onSubmit={(e) => e.preventDefault()}>
        <label className="crisisform-full"><span>Name</span><input name="name" value={fields.name} onChange={handleChange} /></label>

        <label><span>Approximate Age</span><input name="approximateAge" value={fields.approximateAge} onChange={handleChange} placeholder="e.g. Around 9 years old" /></label>
        <label><span>Gender</span>
          <select name="gender" value={fields.gender} onChange={handleChange}>
            {MISSING_PERSON_GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </label>

        <label><span>Last Seen Date</span><input type="date" name="lastSeenDate" value={fields.lastSeenDate} onChange={handleChange} /></label>
        <label><span>General Last-Seen Location</span><input name="lastSeenLocation" value={fields.lastSeenLocation} onChange={handleChange} placeholder="Neighborhood or city, not a precise address" /></label>

        <label className="crisisform-full"><span>Clothing Description</span><input name="clothingDescription" value={fields.clothingDescription} onChange={handleChange} /></label>
        <label className="crisisform-full"><span>Distinguishing Features</span><input name="distinguishingFeatures" value={fields.distinguishingFeatures} onChange={handleChange} /></label>
        <label className="crisisform-full"><span>Safe Contact Method (may be shown publicly)</span><input name="safeContactMethod" value={fields.safeContactMethod} onChange={handleChange} placeholder="e.g. Contact Congo Unity admin, or a hotline number" /></label>

        <label className="crisisform-full">
          <span>Photo (optional)</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => photo.selectFile(e.target.files[0])} />
          {photo.previewUrl && <img src={photo.previewUrl} alt="Preview" className="crisisform-image-preview" />}
          {photo.error && <p className="register-form__error" role="alert">{photo.error}</p>}
        </label>

        <div className="crisisform-actions">
          <button type="button" onClick={submit} disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : editingId ? "Save Changes" : "Submit Case"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} disabled={isSubmitting}>Cancel Edit</button>
          )}
        </div>
      </form>

      <div className="crisisform-mylist">
        <h2>Your Missing Person Cases</h2>
        {loadingCases ? (
          <p>Loading…</p>
        ) : myCases.length === 0 ? (
          <p>You haven't submitted any missing person cases yet.</p>
        ) : (
          myCases.map((mpCase) => (
            <div className="crisisform-mylist-row" key={mpCase.id}>
              <div className="crisisform-mylist-title">
                <strong>{mpCase.name}</strong>
                <span className={`crisis-status-badge crisis-status-${missingPersonStatusBadgeSuffix(mpCase.status)}`}>
                  {MISSING_PERSON_STATUS_LABELS[mpCase.status] || mpCase.status}
                </span>
              </div>
              <p>Last seen: {mpCase.lastSeenLocation}</p>
              {mpCase.adminMessage && <p className="crisisform-mylist-message">Admin: {mpCase.adminMessage}</p>}
              {["submitted", "under_review"].includes(mpCase.status) && (
                <div className="crisisform-mylist-actions">
                  <button type="button" onClick={() => startEditing(mpCase)}>Edit</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default ReportMissingPerson;
