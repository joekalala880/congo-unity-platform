import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { listPublicCrisisAlerts } from "../services/crisisReportsService";
import { listPublicMissingPersonCases } from "../services/missingPersonsService";
import { listActiveEmergencyResources } from "../services/emergencyResourcesService";
import {
  CRISIS_CATEGORIES,
  CRISIS_DISCLAIMER,
  CRISIS_URGENCY_LEVELS,
  urgencyLabel,
} from "../services/crisisTypes";
import "./Crisis.css";

const ALERT_STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "verified", label: "Active" },
  { value: "resolved", label: "Resolved" },
  { value: "archived", label: "Archived" },
];

function Crisis() {
  const [user, setUser] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [missingPersons, setMissingPersons] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("all");
  const [urgency, setUrgency] = useState("all");
  const [statusFilter, setStatusFilter] = useState("verified");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [alertsData, missingData, resourcesData] = await Promise.all([
          listPublicCrisisAlerts(),
          listPublicMissingPersonCases(),
          listActiveEmergencyResources(),
        ]);
        setAlerts(alertsData);
        setMissingPersons(missingData);
        setResources(resourcesData);
      } catch (err) {
        console.error("Failed to load Crisis Center data:", err);
        setError("We couldn't load the Crisis Center right now. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredAlerts = useMemo(() => {
    return alerts
      .filter((a) => {
        if (statusFilter !== "all" && a.status !== statusFilter) return false;
        if (category !== "all" && a.category !== category) return false;
        if (urgency !== "all" && a.urgency !== urgency) return false;
        if (province.trim() && !(a.province || "").toLowerCase().includes(province.trim().toLowerCase())) return false;
        if (city.trim() && !(a.cityVillage || "").toLowerCase().includes(city.trim().toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => (b.publishedAt?.toMillis?.() || 0) - (a.publishedAt?.toMillis?.() || 0));
  }, [alerts, statusFilter, category, urgency, province, city]);

  return (
    <div className="crisiscenter-page">
      <section className="register-section">
        <div className="register-header">
          <h1>Crisis &amp; Emergency Center</h1>
          <p>Verified crisis alerts, missing persons, and emergency resources for Congolese communities.</p>
        </div>

        <div className="crisiscenter-disclaimer" role="alert">
          <strong>Important:</strong> {CRISIS_DISCLAIMER}
        </div>

        <div className="crisiscenter-actions">
          {user ? (
            <Link to="/crisis/report"><button>Report a Crisis</button></Link>
          ) : (
            <Link to="/login"><button>Log In to Report a Crisis</button></Link>
          )}
          <Link to="/crisis/missing-persons"><button type="button">Missing Persons</button></Link>
          <Link to="/crisis/resources"><button type="button">Emergency Resources</button></Link>
        </div>

        {error && <p className="register-form__error" role="alert">{error}</p>}

        <h2>Verified Crisis Alerts</h2>

        <div className="crisiscenter-filters">
          <input type="text" placeholder="Province…" value={province} onChange={(e) => setProvince(e.target.value)} aria-label="Filter by province" />
          <input type="text" placeholder="City / Village…" value={city} onChange={(e) => setCity(e.target.value)} aria-label="Filter by city" />
          <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
            <option value="all">All Categories</option>
            {CRISIS_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={urgency} onChange={(e) => setUrgency(e.target.value)} aria-label="Filter by urgency">
            <option value="all">All Urgency Levels</option>
            {CRISIS_URGENCY_LEVELS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
            {ALERT_STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        {loading ? (
          <p>Loading…</p>
        ) : filteredAlerts.length === 0 ? (
          <div className="card">
            <h3>No alerts match your filters</h3>
            <p>Try adjusting your filters, or check back soon.</p>
          </div>
        ) : (
          <div className="cards">
            {filteredAlerts.map((alert) => (
              <div className="card" key={alert.id}>
                <span className={`crisiscenter-urgency crisiscenter-urgency-${alert.urgency}`}>
                  {urgencyLabel(alert.urgency)}
                </span>
                <h3>{alert.title}</h3>
                <p><strong>Category:</strong> {alert.category}</p>
                <p><strong>Location:</strong> {[alert.cityVillage, alert.territory, alert.province].filter(Boolean).join(", ") || "General area withheld"}</p>
                {alert.peopleAffectedCount > 0 && (
                  <p><strong>People Affected:</strong> {alert.peopleAffectedCount}</p>
                )}
                <p>{alert.description}</p>
                {alert.reporterDisplayName && <p className="crisiscenter-reporter">Reported by {alert.reporterDisplayName}</p>}
              </div>
            ))}
          </div>
        )}

        <h2>Recent Missing Persons</h2>
        {missingPersons.length === 0 ? (
          <p className="crisiscenter-empty">No missing person cases reported.</p>
        ) : (
          <div className="cards">
            {missingPersons.slice(0, 3).map((mp) => (
              <div className="card" key={mp.id}>
                {mp.photoUrl && <img src={mp.photoUrl} alt={mp.name} className="crisiscenter-thumb" />}
                <h3>{mp.name}</h3>
                <p><strong>Last seen:</strong> {mp.lastSeenLocation}</p>
                <Link to={`/crisis/missing-persons/${mp.id}`}><button type="button">View Case</button></Link>
              </div>
            ))}
          </div>
        )}
        <Link to="/crisis/missing-persons">View all missing persons →</Link>

        <h2>Emergency Resources</h2>
        {resources.length === 0 ? (
          <p className="crisiscenter-empty">No emergency resources listed yet.</p>
        ) : (
          <div className="cards">
            {resources.slice(0, 4).map((r) => (
              <div className="card" key={r.id}>
                <h3>{r.name}</h3>
                <p>{r.description}</p>
                {r.phone && <p><strong>Phone:</strong> {r.phone}</p>}
              </div>
            ))}
          </div>
        )}
        <Link to="/crisis/resources">View all emergency resources →</Link>
      </section>
    </div>
  );
}

export default Crisis;
