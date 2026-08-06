import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, doc, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useIdDocumentUpload } from "../hooks/useIdDocumentUpload";
import { getJob } from "../services/jobsService";
import { applyToJob, getMyApplicationForJob } from "../services/jobApplicationsService";
import { APPLICATION_STATUS_LABELS, JOB_REPORT_REASONS, applicationStatusBadgeSuffix } from "../services/jobTypes";
import "./JobDetails.css";

function JobDetails() {
  const { id } = useParams();

  const [user, setUser] = useState(null);
  const [job, setJob] = useState(null);
  const [myApplication, setMyApplication] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [savedItemId, setSavedItemId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [fullName, setFullName] = useState("");
  const idDoc = useIdDocumentUpload();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");

      try {
        const jobData = await getJob(id);
        setJob(jobData);

        if (auth.currentUser) {
          const profileSnap = await getDocs(
            query(collection(db, "congoleseProfiles"), where("email", "==", auth.currentUser.email))
          );
          if (!profileSnap.empty) {
            const p = profileSnap.docs[0].data();
            setFullName(`${p.firstName || ""} ${p.lastName || ""}`.trim());
          }

          const existingApplication = await getMyApplicationForJob(id, auth.currentUser.uid);
          setMyApplication(existingApplication);

          const savedSnap = await getDocs(
            query(
              collection(db, "savedItems"),
              where("userEmail", "==", auth.currentUser.email),
              where("type", "==", "job"),
              where("jobId", "==", id)
            )
          );
          const activeSaved = savedSnap.docs.find((d) => d.data().removed !== true);
          if (activeSaved) {
            setIsSaved(true);
            setSavedItemId(activeSaved.id);
          }
        }
      } catch (err) {
        console.error("Failed to load job:", err);
        setError("We couldn't load this job right now. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, user]);

  const toggleSave = async () => {
    if (!user) {
      alert("Please log in to save jobs.");
      return;
    }

    try {
      if (isSaved && savedItemId) {
        await updateDoc(doc(db, "savedItems", savedItemId), { removed: true });
        setIsSaved(false);
        setSavedItemId(null);
      } else {
        const ref = await addDoc(collection(db, "savedItems"), {
          userEmail: user.email,
          type: "job",
          jobId: id,
          title: job.title,
          description: `${job.companyName} · ${job.location || "Remote"}`,
          link: `/jobs/${id}`,
          removed: false,
          createdAt: serverTimestamp(),
        });
        setIsSaved(true);
        setSavedItemId(ref.id);
      }
    } catch (err) {
      console.error("Failed to save/unsave job:", err);
    }
  };

  const handleReport = async () => {
    if (!user) {
      alert("Please log in to report a job.");
      return;
    }

    const reasonInput = window.prompt(
      `Why are you reporting this job? Enter one of: ${JOB_REPORT_REASONS.map((r) => r.value).join(", ")}`
    );
    if (reasonInput === null) return;

    const reason = JOB_REPORT_REASONS.find((r) => r.value === reasonInput.trim().toLowerCase())?.value || "other";
    const message = window.prompt("Any additional details? (optional)") || "";

    try {
      await addDoc(collection(db, "jobReports"), {
        jobId: id,
        reporterId: user.uid,
        reporterEmail: user.email,
        reason,
        message,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      alert("Thanks — this job has been reported to our admin team.");
    } catch (err) {
      console.error("Failed to report job:", err);
      alert("Couldn't submit your report. Please try again.");
    }
  };

  const handleApply = async () => {
    if (!user) {
      alert("Please log in to apply.");
      return;
    }

    if (!fullName.trim()) {
      setApplyError("Full name is required.");
      return;
    }

    setApplying(true);
    setApplyError("");

    try {
      let resumeCloudinaryPublicId = "";
      let resumeResourceType = "";
      let resumeFileName = "";

      if (idDoc.file) {
        const idToken = await user.getIdToken();
        const { publicId, resourceType } = await idDoc.uploadDocument(idToken, "resume");
        resumeCloudinaryPublicId = publicId;
        resumeResourceType = resourceType;
        resumeFileName = idDoc.file.name;
      }

      const applicationId = await applyToJob(user, job, {
        applicantFullName: fullName,
        coverLetter,
        resumeCloudinaryPublicId,
        resumeResourceType,
        resumeFileName,
      });

      setMyApplication({
        id: applicationId,
        status: "applied",
        applicantFullName: fullName,
        coverLetter,
        resumeFileName,
      });
    } catch (err) {
      console.error("Failed to apply:", err);
      setApplyError(err.message || "Couldn't submit your application. Please try again.");
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="register-section">
        <p className="jobdet-loading">Loading job…</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="register-section">
        <div className="card">
          <h3>Job not found</h3>
          <p>{error || "This job doesn't exist or is no longer available."}</p>
          <Link to="/jobs"><button>Back to Jobs</button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="register-section">
      <div className="card jobdet-card">
        <h1>{job.title}</h1>

        <p><strong>Company:</strong> {job.companyName}</p>
        <p><strong>Location:</strong> {job.location || "—"} {job.locationType ? `(${job.locationType})` : ""}</p>
        <p><strong>Type:</strong> {job.type || "—"}</p>
        {job.category && <p><strong>Category:</strong> {job.category}</p>}
        {job.experienceLevel && <p><strong>Experience Level:</strong> {job.experienceLevel}</p>}
        {job.salaryRange && <p><strong>Salary Range:</strong> {job.salaryRange}</p>}

        <p className="jobdet-description">{job.description}</p>

        <div className="jobdet-actions">
          <button type="button" onClick={toggleSave}>{isSaved ? "★ Saved" : "☆ Save Job"}</button>
          {user && <button type="button" onClick={handleReport}>Report Job</button>}
          <Link to="/jobs"><button type="button">Back to Jobs</button></Link>
        </div>

        {!user ? (
          <p className="jobdet-login-note">
            <Link to="/login">Log in</Link> to apply for this job.
          </p>
        ) : myApplication ? (
          <div className="jobdet-applied-card">
            <h3>You've applied to this job</h3>
            <span className={`jobdet-badge jobdet-badge-${applicationStatusBadgeSuffix(myApplication.status)}`}>
              {APPLICATION_STATUS_LABELS[myApplication.status] || myApplication.status}
            </span>
            <p>
              <Link to="/my-applications">Track your application</Link>
            </p>
          </div>
        ) : (
          <div className="jobdet-apply-card">
            <h3>Apply Using Your Congo Unity Profile</h3>

            {applyError && <p className="register-form__error" role="alert">{applyError}</p>}

            <label>
              <span>Full Name</span>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </label>

            <label>
              <span>Cover Letter (optional)</span>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Tell the employer why you're a good fit…"
              />
            </label>

            <label>
              <span>Resume (optional)</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => idDoc.selectFile(e.target.files[0])}
              />
              {idDoc.file && <span className="jobdet-file-name">{idDoc.file.name}</span>}
              {idDoc.error && <p className="register-form__error" role="alert">{idDoc.error}</p>}
            </label>

            <button type="button" onClick={handleApply} disabled={applying}>
              {applying ? (idDoc.isUploading ? `Uploading… ${idDoc.uploadProgress}%` : "Submitting…") : "Submit Application"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default JobDetails;
