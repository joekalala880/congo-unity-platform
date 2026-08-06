import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { getJob } from "../services/jobsService";
import { listApplicationsForJob, updateApplicationStatus } from "../services/jobApplicationsService";
import { APPLICATION_STATUS_LABELS, applicationStatusBadgeSuffix } from "../services/jobTypes";
import "./JobApplicants.css";

const SIGNING_ENDPOINT = import.meta.env.VITE_ID_DOCUMENT_SIGNING_ENDPOINT;

function formatDate(value) {
  if (!value) return "—";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function JobApplicants() {
  const { jobId } = useParams();
  const [user, setUser] = useState(null);
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [viewingResume, setViewingResume] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const jobData = await getJob(jobId);
        setJob(jobData);

        if (jobData && jobData.employerId === currentUser.uid) {
          const apps = await listApplicationsForJob(jobId, currentUser.uid);
          setApplications(apps);
        }
      } catch (err) {
        console.error("Failed to load applicants:", err);
        setError("We couldn't load applicants right now. Please try again.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [jobId]);

  const applyStatusChange = async (application, status, interviewInstructions = "") => {
    setBusyId(application.id);
    setError("");
    try {
      await updateApplicationStatus(user, application, status, interviewInstructions);
      setApplications((prev) =>
        prev.map((a) => (a.id === application.id ? { ...a, status, interviewInstructions } : a))
      );
    } catch (err) {
      console.error("Failed to update application status:", err);
      setError("Couldn't update this application. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const handleInterview = (application) => {
    const instructions = window.prompt("Interview instructions to send the applicant:");
    if (instructions === null) return;
    applyStatusChange(application, "interview", instructions.trim());
  };

  const handleReject = (application) => {
    if (!window.confirm("Mark this applicant as rejected? They'll be notified.")) return;
    applyStatusChange(application, "rejected");
  };

  const viewResume = async (application) => {
    if (!SIGNING_ENDPOINT) {
      setError("Resume viewing isn't configured yet.");
      return;
    }

    setViewingResume(application.id);
    setError("");
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(SIGNING_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          action: "view",
          publicId: application.resumeCloudinaryPublicId,
          resourceType: application.resumeResourceType || "image",
          applicationId: application.id,
        }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Could not open this resume.");
      window.open(body.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Failed to view resume:", err);
      setError(err.message || "Could not open this resume.");
    } finally {
      setViewingResume(null);
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
          <p>This job doesn't exist or isn't yours.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>Applicants for {job.title}</h1>
        <p>{applications.length} applicant{applications.length === 1 ? "" : "s"}</p>
      </div>

      {error && <p className="register-form__error" role="alert">{error}</p>}

      {applications.length === 0 ? (
        <div className="card">
          <h3>No applicants yet</h3>
          <p>Check back soon.</p>
        </div>
      ) : (
        <div className="jobapp-list">
          {applications.map((app) => (
            <div className="card jobapp-row" key={app.id}>
              <div className="jobapp-row-title">
                <strong>{app.applicantFullName}</strong>
                <span className={`jobapp-badge jobapp-badge-${applicationStatusBadgeSuffix(app.status)}`}>
                  {APPLICATION_STATUS_LABELS[app.status] || app.status}
                </span>
              </div>

              <p>{app.applicantEmail}</p>
              <p className="jobapp-meta">Applied {formatDate(app.createdAt)}</p>

              {app.coverLetter && <p className="jobapp-cover-letter">{app.coverLetter}</p>}

              <div className="jobapp-row-actions">
                <Link to={`/profile/${encodeURIComponent(app.applicantEmail)}`}>
                  <button type="button">View Profile</button>
                </Link>

                {app.resumeCloudinaryPublicId && (
                  <button type="button" onClick={() => viewResume(app)} disabled={viewingResume === app.id}>
                    {viewingResume === app.id ? "Loading…" : "View Resume"}
                  </button>
                )}

                <Link to={`/direct-messages?with=${app.applicantUserId}`}>
                  <button type="button">Message</button>
                </Link>

                {app.status !== "withdrawn" && app.status !== "rejected" && app.status !== "offered" && (
                  <>
                    {app.status === "applied" && (
                      <button type="button" onClick={() => applyStatusChange(app, "under_review")} disabled={busyId === app.id}>
                        Mark Under Review
                      </button>
                    )}
                    <button type="button" onClick={() => handleInterview(app)} disabled={busyId === app.id}>
                      Move to Interview
                    </button>
                    <button type="button" onClick={() => applyStatusChange(app, "offered")} disabled={busyId === app.id}>
                      Extend Offer
                    </button>
                    <button type="button" className="jobapp-reject-button" onClick={() => handleReject(app)} disabled={busyId === app.id}>
                      Reject
                    </button>
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

export default JobApplicants;
