import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { getCompany, saveCompany } from "../services/companyService";
import { createJob } from "../services/jobsService";
import { EXPERIENCE_LEVELS, JOB_CATEGORIES, JOB_TYPES, LOCATION_TYPES } from "../services/jobTypes";
import "./CreateJob.css";

const EMPTY_FIELDS = {
  title: "",
  description: "",
  category: JOB_CATEGORIES[0],
  type: JOB_TYPES[0],
  locationType: LOCATION_TYPES[0].value,
  location: "",
  experienceLevel: EXPERIENCE_LEVELS[0].value,
  salaryRange: "",
};

function CreateJob() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [fields, setFields] = useState(EMPTY_FIELDS);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const existingCompany = await getCompany(currentUser.uid);
        setCompany(existingCompany);
        if (existingCompany) setCompanyName(existingCompany.name);
      } catch (err) {
        console.error("Failed to load company profile:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!companyName.trim()) {
      setError("Company name is required.");
      return;
    }
    if (!fields.title.trim() || !fields.description.trim()) {
      setError("Job title and description are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      await saveCompany(user, company, {
        name: companyName.trim(),
        description: company?.description || "",
        website: company?.website || "",
        logoUrl: company?.logoUrl || "",
        industry: company?.industry || "",
      });
      await createJob(user, { ...fields, companyName: companyName.trim() });
      alert("Job submitted for admin approval. You'll be notified once it's reviewed.");
      navigate("/employer/jobs");
    } catch (err) {
      console.error("Failed to post job:", err);
      setError(err.message || "Couldn't post this job. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className="register-section">
        <p>Loading…</p>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="register-section">
        <div className="register-header">
          <h1>Post a Job</h1>
          <p>Please log in to post a job.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>Post a Job</h1>
        <p>New job posts are reviewed by an admin before they go live.</p>
      </div>

      <form className="register-form createjob-form" onSubmit={handleSubmit}>
        {error && <p className="register-form__error" role="alert">{error}</p>}

        <label>
          <span>Company Name</span>
          <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Company Name" />
        </label>

        <label>
          <span>Job Title</span>
          <input name="title" value={fields.title} onChange={handleChange} placeholder="Job Title" />
        </label>

        <label>
          <span>Description</span>
          <textarea name="description" value={fields.description} onChange={handleChange} placeholder="Job Description" />
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
            <input name="location" value={fields.location} onChange={handleChange} placeholder="City, Country" />
          </label>

          <label>
            <span>Salary Range (optional)</span>
            <input name="salaryRange" value={fields.salaryRange} onChange={handleChange} placeholder="e.g. $50,000 - $70,000" />
          </label>
        </div>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting…" : "Submit for Approval"}
        </button>
      </form>
    </section>
  );
}

export default CreateJob;
