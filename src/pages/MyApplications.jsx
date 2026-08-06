import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { listMyApplications, withdrawApplication } from "../services/jobApplicationsService";
import { APPLICATION_STATUS_LABELS, applicationStatusBadgeSuffix } from "../services/jobTypes";
import "./MyApplications.css";

const SIGNING_ENDPOINT = import.meta.env.VITE_ID_DOCUMENT_SIGNING_ENDPOINT;

function formatDate(value) {
  if (!value) return "—";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function MyApplications() {
  const [user, setUser] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [viewingResumeId, setViewingResumeId] = useState(null);

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
        const apps = await listMyApplications(currentUser.uid);
        setApplications(apps);
      } catch (err) {
        console.error("Failed to load applications:", err);
        setError("We couldn't load your applications right now. Please try again.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const viewResume = async (app) => {
    if (!SIGNING_ENDPOINT || !user) return;

    setViewingResumeId(app.id);
    setError("");
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(SIGNING_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          action: "view",
          publicId: app.resumeCloudinaryPublicId,
          resourceType: app.resumeResourceType || "image",
          applicationId: app.id,
        }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Could not open this resume.");
      window.open(body.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Failed to view resume:", err);
      setError(err.message || "Could not open this resume.");
    } finally {
      setViewingResumeId(null);
    }
  };

  const handleWithdraw = async (applicationId) => {
    if (!window.confirm("Withdraw this application? This can't be undone.")) return;

    setBusyId(applicationId);
    try {
      await withdrawApplication(applicationId);
      setApplications((prev) => prev.map((a) => (a.id === applicationId ? { ...a, status: "withdrawn" } : a)));
    } catch (err) {
      console.error("Failed to withdraw application:", err);
      setError("Couldn't withdraw this application. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>My Applications</h1>
        <p>Track the jobs you've applied to.</p>
      </div>

      <div className="myapp-actions">
        <Link to="/jobs"><button>Browse Jobs</button></Link>
      </div>

      {error && <p className="register-form__error" role="alert">{error}</p>}

      {loading ? (
        <p>Loading…</p>
      ) : !user ? (
        <p>Please log in to view your applications.</p>
      ) : applications.length === 0 ? (
        <div className="card">
          <h3>No applications yet</h3>
          <p>Browse jobs and apply to start tracking your applications here.</p>
        </div>
      ) : (
        <div className="myapp-list">
          {applications.map((app) => (
            <div className="card myapp-row" key={app.id}>
              <div className="myapp-row-title">
                <Link to={`/jobs/${app.jobId}`}><strong>{app.jobTitle || "Job"}</strong></Link>
                <span className={`myapp-badge myapp-badge-${applicationStatusBadgeSuffix(app.status)}`}>
                  {APPLICATION_STATUS_LABELS[app.status] || app.status}
                </span>
              </div>
              <p>{app.companyName}</p>
              <p className="myapp-meta">Applied {formatDate(app.createdAt)}</p>

              {app.status === "interview" && app.interviewInstructions && (
                <p className="myapp-interview-note"><strong>Interview details:</strong> {app.interviewInstructions}</p>
              )}

              <div className="myapp-row-actions">
                {app.resumeCloudinaryPublicId && (
                  <button type="button" onClick={() => viewResume(app)} disabled={viewingResumeId === app.id}>
                    {viewingResumeId === app.id ? "Loading…" : "View Resume"}
                  </button>
                )}

                {app.status === "applied" && (
                  <button type="button" onClick={() => handleWithdraw(app.id)} disabled={busyId === app.id}>
                    {busyId === app.id ? "Withdrawing…" : "Withdraw Application"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default MyApplications;
