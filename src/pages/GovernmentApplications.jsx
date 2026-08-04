import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { listMyApplications } from "../services/serviceApplicationsService";
import { SERVICE_TYPES, STATUS_LABELS, statusBadgeSuffix } from "../services/serviceApplicationTypes";
import "./GovernmentApplications.css";

function formatDate(value) {
  if (!value) return "—";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function RowSkeleton() {
  return (
    <div className="govapp-row">
      <div className="govapp-skeleton" style={{ width: "40%", height: 16 }} />
      <div className="govapp-skeleton" style={{ width: "60%", height: 12, marginTop: 8 }} />
    </div>
  );
}

function GovernmentApplications() {
  const [user, setUser] = useState(null);
  const [applications, setApplications] = useState([]);
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

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>My Applications</h1>
        <p>Track your Congo Unity Platform government service requests.</p>
      </div>

      {error && <p className="register-form__error" role="alert">{error}</p>}

      <div className="govapp-actions">
        <Link to="/government/services">
          <button>Start New Application</button>
        </Link>
      </div>

      {loading ? (
        <div className="govapp-list">
          <RowSkeleton />
          <RowSkeleton />
        </div>
      ) : !user ? (
        <p className="govapp-empty">Please log in to view your applications.</p>
      ) : applications.length === 0 ? (
        <div className="govapp-empty">
          <p>No applications yet.</p>
        </div>
      ) : (
        <div className="govapp-list">
          {applications.map((app) => (
            <Link to={`/government/applications/${app.id}`} className="govapp-row" key={app.id}>
              <div className="govapp-row-title">
                <strong>{SERVICE_TYPES[app.serviceType]?.label || app.serviceType}</strong>
                <span className={`govapp-badge govapp-badge-${statusBadgeSuffix(app.status)}`}>
                  {STATUS_LABELS[app.status] || app.status}
                </span>
              </div>
              <p className="govapp-row-meta">
                {app.status === "draft" ? "Last saved" : "Submitted"} {formatDate(app.updatedAt)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export default GovernmentApplications;
