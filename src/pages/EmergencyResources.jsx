import { useEffect, useMemo, useState } from "react";
import { listActiveEmergencyResources } from "../services/emergencyResourcesService";
import { RESOURCE_TYPES, resourceTypeLabel } from "../services/crisisTypes";
import "./Crisis.css";

function EmergencyResources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [province, setProvince] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await listActiveEmergencyResources();
        setResources(data);
      } catch (err) {
        console.error("Failed to load emergency resources:", err);
        setError("We couldn't load emergency resources right now. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    return resources.filter((r) => {
      if (typeFilter !== "all" && r.resourceType !== typeFilter) return false;
      if (province.trim() && !(r.province || "").toLowerCase().includes(province.trim().toLowerCase())) return false;
      if (search.trim()) {
        const haystack = `${r.name} ${r.description} ${r.cityVillage}`.toLowerCase();
        if (!haystack.includes(search.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [resources, search, typeFilter, province]);

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>Emergency Resources</h1>
        <p>Admin-verified hospitals, shelters, hotlines, and organizations that can help.</p>
      </div>

      <div className="crisiscenter-filters">
        <input type="text" placeholder="Search by name…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search resources" />
        <input type="text" placeholder="Province…" value={province} onChange={(e) => setProvince(e.target.value)} aria-label="Filter by province" />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} aria-label="Filter by resource type">
          <option value="all">All Types</option>
          {RESOURCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {error && <p className="register-form__error" role="alert">{error}</p>}

      {loading ? (
        <p>Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="card">
          <h3>No resources match your search</h3>
          <p>Try adjusting your filters, or check back soon.</p>
        </div>
      ) : (
        <div className="cards">
          {filtered.map((r) => (
            <div className="card" key={r.id}>
              <span className="crisiscenter-urgency crisiscenter-urgency-low">{resourceTypeLabel(r.resourceType)}</span>
              <h3>{r.name}</h3>
              <p>{r.description}</p>
              <p><strong>Location:</strong> {[r.cityVillage, r.territory, r.province].filter(Boolean).join(", ") || "Not specified"}</p>
              {r.address && <p><strong>Address:</strong> {r.address}</p>}
              {r.phone && <p><strong>Phone:</strong> {r.phone}</p>}
              {r.email && <p><strong>Email:</strong> {r.email}</p>}
              {r.website && <p><a href={r.website} target="_blank" rel="noopener noreferrer">Visit Website</a></p>}
              {r.hours && <p><strong>Hours:</strong> {r.hours}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default EmergencyResources;
