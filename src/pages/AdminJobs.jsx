import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { createNotification } from "../services/notificationService";
import { JOB_STATUS_LABELS, jobStatusBadgeSuffix } from "../services/jobTypes";
import "./AdminJobs.css";

function formatDate(value) {
  if (!value) return "—";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function AdminJobs() {
  const [admin, setAdmin] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [reports, setReports] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setAdmin(user));
    return () => unsubscribe();
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [jobsSnap, appsSnap, reportsSnap, companiesSnap] = await Promise.all([
        getDocs(collection(db, "jobs")),
        getDocs(collection(db, "jobApplications")),
        getDocs(collection(db, "jobReports")),
        getDocs(collection(db, "companies")),
      ]);

      setJobs(
        jobsSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
      );
      setApplications(appsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setReports(
        reportsSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
      );
      setCompanies(companiesSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Failed to load admin jobs data:", err);
      setError("We couldn't load this page right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await loadAll();
    })();
  }, [loadAll]);

  const pendingJobs = jobs.filter((j) => j.status === "pending_approval");
  const filteredJobs = jobs.filter((j) => {
    if (!search.trim()) return true;
    const haystack = `${j.title} ${j.companyName} ${j.employerEmail}`.toLowerCase();
    return haystack.includes(search.trim().toLowerCase());
  });
  const pendingReports = reports.filter((r) => r.status === "pending");

  const notifyEmployer = async (job, message) => {
    try {
      await createNotification({
        to: job.employerEmail,
        from: "Congo Unity Admin",
        type: "Job Posting Update",
        message,
        relatedRoute: "/employer/jobs",
      });
    } catch (err) {
      console.error("Failed to notify employer:", err);
    }
  };

  const approveJob = async (job) => {
    setBusyId(job.id);
    try {
      await updateDoc(doc(db, "jobs", job.id), {
        status: "published",
        rejectionReason: "",
        updatedAt: serverTimestamp(),
      });
      await notifyEmployer(job, `Your job posting "${job.title}" was approved and is now live.`);
      await loadAll();
    } catch (err) {
      console.error("Failed to approve job:", err);
      setError("Couldn't approve this job. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const rejectJob = async (job) => {
    const reason = window.prompt("Reason for rejecting this job posting? (required)");
    if (reason === null) return;
    if (!reason.trim()) {
      setError("A rejection reason is required.");
      return;
    }

    setBusyId(job.id);
    try {
      await updateDoc(doc(db, "jobs", job.id), {
        status: "rejected",
        rejectionReason: reason.trim(),
        updatedAt: serverTimestamp(),
      });
      await notifyEmployer(job, `Your job posting "${job.title}" was rejected: ${reason.trim()}`);
      await loadAll();
    } catch (err) {
      console.error("Failed to reject job:", err);
      setError("Couldn't reject this job. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const removeJob = async (job) => {
    if (!window.confirm(`Remove "${job.title}"? This is for fraudulent or expired postings.`)) return;

    setBusyId(job.id);
    try {
      await updateDoc(doc(db, "jobs", job.id), {
        status: "removed",
        updatedAt: serverTimestamp(),
      });
      await notifyEmployer(job, `Your job posting "${job.title}" was removed by an admin.`);
      await loadAll();
    } catch (err) {
      console.error("Failed to remove job:", err);
      setError("Couldn't remove this job. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const resolveReport = async (report, status) => {
    setBusyId(report.id);
    try {
      await updateDoc(doc(db, "jobReports", report.id), {
        status,
        reviewedBy: admin.email,
        reviewedAt: serverTimestamp(),
      });
      await loadAll();
    } catch (err) {
      console.error("Failed to update report:", err);
      setError("Couldn't update this report. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const toggleVerified = async (company) => {
    setBusyId(company.id);
    try {
      await updateDoc(doc(db, "companies", company.id), { verified: !company.verified, updatedAt: serverTimestamp() });
      await loadAll();
    } catch (err) {
      console.error("Failed to update employer verification:", err);
      setError("Couldn't update this employer. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <div className="admjobs-page"><p>Loading…</p></div>;
  }

  return (
    <div className="admjobs-page">
      <div className="admjobs-header">
        <h1>Jobs Administration</h1>
        <p>Review job posts, reports, and employer verification.</p>
      </div>

      {error && <p className="register-form__error" role="alert">{error}</p>}

      <div className="admjobs-stats">
        <div className="admjobs-stat"><span>{jobs.length}</span><p>Total Jobs</p></div>
        <div className="admjobs-stat"><span>{jobs.filter((j) => j.status === "published").length}</span><p>Published</p></div>
        <div className="admjobs-stat"><span>{pendingJobs.length}</span><p>Pending Approval</p></div>
        <div className="admjobs-stat"><span>{applications.length}</span><p>Total Applications</p></div>
        <div className="admjobs-stat"><span>{pendingReports.length}</span><p>Pending Reports</p></div>
      </div>

      <section className="admjobs-section">
        <h2>Pending Job Posts ({pendingJobs.length})</h2>
        {pendingJobs.length === 0 ? (
          <p className="admjobs-empty">Nothing pending review.</p>
        ) : (
          <div className="admjobs-list">
            {pendingJobs.map((job) => (
              <div className="admjobs-row" key={job.id}>
                <div className="admjobs-row-title">
                  <strong>{job.title}</strong>
                  <span>{job.companyName} · {job.employerEmail}</span>
                </div>
                <p>{job.description?.slice(0, 200)}</p>
                <p className="admjobs-meta">Posted {formatDate(job.createdAt)}</p>
                <div className="admjobs-row-actions">
                  <button type="button" onClick={() => approveJob(job)} disabled={busyId === job.id}>Approve</button>
                  <button type="button" className="admjobs-reject" onClick={() => rejectJob(job)} disabled={busyId === job.id}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="admjobs-section">
        <h2>Job Reports ({pendingReports.length} pending)</h2>
        {reports.length === 0 ? (
          <p className="admjobs-empty">No reports filed.</p>
        ) : (
          <div className="admjobs-list">
            {reports.map((report) => {
              const job = jobs.find((j) => j.id === report.jobId);
              return (
                <div className="admjobs-row" key={report.id}>
                  <div className="admjobs-row-title">
                    <strong>{job?.title || report.jobId}</strong>
                    <span className={`admjobs-report-status admjobs-report-${report.status}`}>{report.status}</span>
                  </div>
                  <p><strong>Reason:</strong> {report.reason} · <strong>Reported by:</strong> {report.reporterEmail}</p>
                  {report.message && <p>{report.message}</p>}
                  <p className="admjobs-meta">Filed {formatDate(report.createdAt)}</p>
                  {report.status === "pending" && (
                    <div className="admjobs-row-actions">
                      {job && job.status !== "removed" && (
                        <button type="button" className="admjobs-reject" onClick={() => removeJob(job)} disabled={busyId === report.id}>
                          Remove Job
                        </button>
                      )}
                      <button type="button" onClick={() => resolveReport(report, "reviewed")} disabled={busyId === report.id}>Mark Reviewed</button>
                      <button type="button" onClick={() => resolveReport(report, "dismissed")} disabled={busyId === report.id}>Dismiss</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="admjobs-section">
        <h2>Employer Verification</h2>
        {companies.length === 0 ? (
          <p className="admjobs-empty">No employer profiles yet.</p>
        ) : (
          <div className="admjobs-list">
            {companies.map((company) => (
              <div className="admjobs-row admjobs-row-inline" key={company.id}>
                <span>{company.name}{company.verified && <span className="admjobs-verified-badge"> ✓ Verified</span>}</span>
                <button type="button" onClick={() => toggleVerified(company)} disabled={busyId === company.id}>
                  {company.verified ? "Remove Verification" : "Verify Employer"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="admjobs-section">
        <h2>All Jobs</h2>
        <input
          type="text"
          placeholder="Search by title, company, or employer email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admjobs-search"
        />
        <div className="admjobs-list">
          {filteredJobs.map((job) => (
            <div className="admjobs-row admjobs-row-inline" key={job.id}>
              <span>
                <strong>{job.title}</strong> — {job.companyName}{" "}
                <span className={`admjobs-badge admjobs-badge-${jobStatusBadgeSuffix(job.status)}`}>
                  {JOB_STATUS_LABELS[job.status] || job.status}
                </span>
              </span>
              {job.status !== "removed" && (
                <button type="button" className="admjobs-reject" onClick={() => removeJob(job)} disabled={busyId === job.id}>
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default AdminJobs;
