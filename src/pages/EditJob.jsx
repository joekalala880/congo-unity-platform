import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { closeJob, getJob, updateJobContent } from "../services/jobsService";
import { EXPERIENCE_LEVELS, JOB_CATEGORIES, JOB_STATUS_LABELS, JOB_TYPES, LOCATION_TYPES, jobStatusBadgeSuffix } from "../services/jobTypes";
import "./CreateJob.css";

function EditJob() {
  const { jobId } = useParams();
  const [user, setUser] = useState(null);
  const [job, setJob] = useState(null);
  const [fields, setFields] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const jobData = await getJob(jobId);
        setJob(jobData);
        if (jobData) {
          setFields({
            title: jobData.title || "",
            description: jobData.description || "",
            category: jobData.category || JOB_CATEGORIES[0],
            type: jobData.type || JOB_TYPES[0],
            locationType: jobData.locationType || LOCATION_TYPES[0].value,
            location: jobData.location || "",
            experienceLevel: jobData.experienceLevel || EXPERIENCE_LEVELS[0].value,
            salaryRange: jobData.salaryRange || "",
          });
        }
      } catch (err) {
        console.error("Failed to load job:", err);
        setError("We couldn't load this job. Please try again.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [jobId]);

  const handleChange = (e) => {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!fields.title.trim() || !fields.description.trim()) {
      setError("Job title and description are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateJobContent(jobId, fields);
      setSuccessMessage("Job updated.");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      console.error("Failed to update job:", err);
      setError(err.message || "Couldn't update this job. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = async () => {
    if (!window.confirm("Close this job posting? It will no longer accept applications.")) return;

    try {
      await closeJob(jobId);
      setJob((prev) => ({ ...prev, status: "closed" }));
    } catch (err) {
      console.error("Failed to close job:", err);
      setError("Couldn't close this job. Please try again.");
    }
  };

  if (loading) {
    return <section className="register-section"><p>Loading…</p></section>;
  }

  if (!user || !job || job.employerId !== user.uid) {
    return (
      <section className="register-section">
        <div className="card">
          <h3>Job not found</h3>
          <p>This job doesn't exist or isn't yours to edit.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>Edit Job</h1>
        <span className={`empjobs-badge empjobs-badge-${jobStatusBadgeSuffix(job.status)}`}>
          {JOB_STATUS_LABELS[job.status] || job.status}
        </span>
      </div>

      {successMessage && <p className="register-form__success" role="status">{successMessage}</p>}
      {error && <p className="register-form__error" role="alert">{error}</p>}

      <form className="register-form createjob-form" onSubmit={handleSubmit}>
        <label>
          <span>Job Title</span>
          <input name="title" value={fields.title} onChange={handleChange} />
        </label>

        <label>
          <span>Description</span>
          <textarea name="description" value={fields.description} onChange={handleChange} />
        </label>

        <div className="createjob-grid">
          <label>
            <span>Category</span>
            <select name="category" value={fields.category} onChange={handleChange}>
              {JOB_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>

          <label>
            <span>Job Type</span>
            <select name="type" value={fields.type} onChange={handleChange}>
              {JOB_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>

          <label>
            <span>Remote / On-site</span>
            <select name="locationType" value={fields.locationType} onChange={handleChange}>
              {LOCATION_TYPES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </label>

          <label>
            <span>Experience Level</span>
            <select name="experienceLevel" value={fields.experienceLevel} onChange={handleChange}>
              {EXPERIENCE_LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </label>

          <label>
            <span>Location</span>
            <input name="location" value={fields.location} onChange={handleChange} />
          </label>

          <label>
            <span>Salary Range (optional)</span>
            <input name="salaryRange" value={fields.salaryRange} onChange={handleChange} />
          </label>
        </div>

        <div className="createjob-actions">
          <button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving…" : "Save Changes"}</button>
          {job.status !== "closed" && (
            <button type="button" onClick={handleClose}>Close Job</button>
          )}
          <Link to="/employer/jobs"><button type="button">Back to My Postings</button></Link>
        </div>
      </form>
    </section>
  );
}

export default EditJob;
