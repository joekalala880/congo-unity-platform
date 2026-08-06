import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { listMyPostedJobs } from "../services/jobsService";
import { countApplicationsForJob } from "../services/jobApplicationsService";
import { JOB_STATUS_LABELS, jobStatusBadgeSuffix } from "../services/jobTypes";
import "./EmployerJobs.css";

function EmployerJobs() {
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applicantCounts, setApplicantCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        const myJobs = await listMyPostedJobs(currentUser.uid);
        setJobs(myJobs);

        const counts = {};
        await Promise.all(
          myJobs.map(async (job) => {
            counts[job.id] = await countApplicationsForJob(job.id, currentUser.uid);
          })
        );
        setApplicantCounts(counts);
      } catch (err) {
        console.error("Failed to load your job postings:", err);
        setError("We couldn't load your job postings right now. Please try again.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>My Job Postings</h1>
        <p>Manage the jobs your company has posted.</p>
      </div>

      <div className="empjobs-actions">
        <Link to="/create-job"><button>Post a New Job</button></Link>
      </div>

      {error && <p className="register-form__error" role="alert">{error}</p>}

      {loading ? (
        <p>Loading…</p>
      ) : !user ? (
        <p>Please log in to manage your job postings.</p>
      ) : jobs.length === 0 ? (
        <div className="card">
          <h3>No job postings yet</h3>
          <p>Post your first job opportunity for the Congo Unity community.</p>
        </div>
      ) : (
        <div className="empjobs-list">
          {jobs.map((job) => (
            <div className="card empjobs-row" key={job.id}>
              <div className="empjobs-row-title">
                <strong>{job.title}</strong>
                <span className={`empjobs-badge empjobs-badge-${jobStatusBadgeSuffix(job.status)}`}>
                  {JOB_STATUS_LABELS[job.status] || job.status}
                </span>
              </div>
              <p>{job.location || "—"} · {job.type || "—"}</p>
              {job.status === "rejected" && job.rejectionReason && (
                <p className="empjobs-rejection">Rejected: {job.rejectionReason}</p>
              )}
              <p className="empjobs-meta">{applicantCounts[job.id] ?? 0} applicant{applicantCounts[job.id] === 1 ? "" : "s"}</p>

              <div className="empjobs-row-actions">
                <Link to={`/employer/jobs/${job.id}/applicants`}><button type="button">View Applicants</button></Link>
                <Link to={`/employer/jobs/${job.id}/edit`}><button type="button">Edit</button></Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default EmployerJobs;
