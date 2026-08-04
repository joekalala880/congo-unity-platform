import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { SERVICE_TYPES, STATUS_LABELS, statusBadgeSuffix } from "../services/serviceApplicationTypes";
import "./AdminServiceApplications.css";

function formatDate(value) {
  if (!value) return "—";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function RowSkeleton() {
  return (
    <div className="admapp-row">
      <div className="admapp-skeleton" style={{ width: "40%", height: 16 }} />
      <div className="admapp-skeleton" style={{ width: "60%", height: 12, marginTop: 8 }} />
    </div>
  );
}

function AdminServiceApplications() {
  const [applications, setApplications] = useState([]);
  const [profilesById, setProfilesById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");

      try {
        const [appsSnap, profilesSnap] = await Promise.all([
          getDocs(collection(db, "serviceApplications")),
          getDocs(collection(db, "congoleseProfiles")),
        ]);

        const byUid = {};
        profilesSnap.docs.forEach((p) => {
          byUid[p.data().userId] = { id: p.id, ...p.data() };
        });

        const apps = appsSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((a) => a.status !== "draft")
          .sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0));

        setProfilesById(byUid);
        setApplications(apps);
      } catch (err) {
        console.error("Failed to load service applications:", err);
        setError("We couldn't load applications right now. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = applications.filter((app) => {
    if (statusFilter !== "all" && app.status !== statusFilter) return false;

    if (search.trim()) {
      const term = search.trim().toLowerCase();
      const haystack = [app.applicantFullName, app.applicantEmail, app.citizenId].filter(Boolean).join(" ").toLowerCase();
      if (!haystack.includes(term)) return false;
    }

    const createdDate = app.createdAt?.toDate?.();
    if (dateFrom && createdDate && createdDate < new Date(dateFrom)) return false;
    if (dateTo && createdDate && createdDate > new Date(`${dateTo}T23:59:59`)) return false;

    return true;
  });

  return (
    <div className="admapp-page">
      <div className="admapp-header">
        <h1>Service Applications</h1>
        <p>Review Congo Unity Platform government service requests.</p>
      </div>

      {error && <p className="register-form__error" role="alert">{error}</p>}

      <div className="admapp-filters">
        <input
          type="text"
          placeholder="Search by name, email, Citizen ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search applications"
        />

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
          <option value="all">All statuses</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under Review</option>
          <option value="more_information_required">More Info Required</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="withdrawn">Withdrawn</option>
        </select>

        <label className="admapp-date-field">
          <span>From</span>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} aria-label="From date" />
        </label>

        <label className="admapp-date-field">
          <span>To</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} aria-label="To date" />
        </label>
      </div>

      {loading ? (
        <div className="admapp-list">
          <RowSkeleton />
          <RowSkeleton />
        </div>
      ) : filtered.length === 0 ? (
        <div className="admapp-empty">
          <p>No applications match your filters.</p>
        </div>
      ) : (
        <>
          <p className="admapp-count">{filtered.length} application{filtered.length === 1 ? "" : "s"}</p>

          <div className="admapp-list">
            {filtered.map((app) => {
              const profile = profilesById[app.applicantUserId];

              return (
                <Link to={`/admin/service-applications/${app.id}`} className="admapp-row" key={app.id}>
                  <div className="admapp-row-title">
                    <strong>{app.applicantFullName}</strong>
                    <span className={`admapp-badge admapp-badge-${statusBadgeSuffix(app.status)}`}>
                      {STATUS_LABELS[app.status] || app.status}
                    </span>
                  </div>
                  <p className="admapp-row-meta">
                    {SERVICE_TYPES[app.serviceType]?.label || app.serviceType} · {app.citizenId || "—"}
                    {profile && ` · Identity: ${profile.status}`}
                  </p>
                  <p className="admapp-row-meta">Created {formatDate(app.createdAt)}</p>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default AdminServiceApplications;
