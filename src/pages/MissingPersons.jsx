import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { listPublicMissingPersonCases } from "../services/missingPersonsService";
import { MISSING_PERSON_STATUS_LABELS, missingPersonStatusBadgeSuffix } from "../services/crisisTypes";
import "./Crisis.css";
import "./CrisisForms.css";

function MissingPersons() {
  const [user, setUser] = useState(null);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await listPublicMissingPersonCases();
        setCases(data);
      } catch (err) {
        console.error("Failed to load missing person cases:", err);
        setError("We couldn't load missing person cases right now. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    return cases.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (search.trim()) {
        const haystack = `${c.name} ${c.lastSeenLocation}`.toLowerCase();
        if (!haystack.includes(search.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [cases, search, statusFilter]);

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>Missing Persons</h1>
        <p>Verified missing person cases from Congolese communities. If you have information, use the safe contact method listed on a case.</p>
      </div>

      <div className="crisiscenter-actions">
        {user ? (
          <Link to="/crisis/missing-persons/report"><button>Report a Missing Person</button></Link>
        ) : (
          <Link to="/login"><button>Log In to Report a Missing Person</button></Link>
        )}
      </div>

      <div className="crisiscenter-filters">
        <input type="text" placeholder="Search by name or last-seen location…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search missing persons" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
          <option value="all">All Cases</option>
          <option value="verified_missing">Still Missing</option>
          <option value="located">Located</option>
        </select>
      </div>

      {error && <p className="register-form__error" role="alert">{error}</p>}

      {loading ? (
        <p>Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="card">
          <h3>No cases match your search</h3>
          <p>Try adjusting your filters, or check back soon.</p>
        </div>
      ) : (
        <div className="cards">
          {filtered.map((mp) => (
            <div className="card" key={mp.id}>
              {mp.photoUrl && <img src={mp.photoUrl} alt={mp.name} className="crisiscenter-thumb" />}
              <span className={`crisis-status-badge crisis-status-${missingPersonStatusBadgeSuffix(mp.status)}`}>
                {MISSING_PERSON_STATUS_LABELS[mp.status] || mp.status}
              </span>
              <h3>{mp.name}</h3>
              <p><strong>Last seen:</strong> {mp.lastSeenLocation}</p>
              {mp.lastSeenDate && <p><strong>Date:</strong> {mp.lastSeenDate}</p>}
              <Link to={`/crisis/missing-persons/${mp.id}`}><button type="button">View Case</button></Link>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default MissingPersons;
