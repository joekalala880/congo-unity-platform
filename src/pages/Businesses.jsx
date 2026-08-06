import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";
import { listApprovedBusinesses } from "../services/businessesService";
import { averageRating } from "../services/businessReviewsService";
import { BUSINESS_CATEGORIES, SORT_OPTIONS } from "../services/businessTypes";
import "./Businesses.css";

function BusinessCardSkeleton() {
  return (
    <div className="card businesses-skeleton-card">
      <div className="businesses-skeleton" style={{ width: "60%", height: 20 }} />
      <div className="businesses-skeleton" style={{ width: "40%", height: 14, marginTop: 10 }} />
      <div className="businesses-skeleton" style={{ width: "90%", height: 12, marginTop: 14 }} />
    </div>
  );
}

function Businesses() {
  const [user, setUser] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [ownerProfilesById, setOwnerProfilesById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState("featured");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [data, profilesSnap] = await Promise.all([
          listApprovedBusinesses(),
          getDocs(collection(db, "congoleseProfiles")),
        ]);
        setBusinesses(data);

        const byUid = {};
        profilesSnap.docs.forEach((p) => {
          byUid[p.id] = p.data();
        });
        setOwnerProfilesById(byUid);
      } catch (err) {
        console.error("Failed to load businesses:", err);
        setError("We couldn't load businesses right now. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const isOwnerVerified = (business) => ownerProfilesById[business.ownerUserId]?.status === "verified";

  const filteredBusinesses = useMemo(() => {
    const filtered = businesses.filter((b) => {
      if (categoryFilter !== "all" && b.category !== categoryFilter) return false;
      if (cityFilter.trim() && !(b.city || "").toLowerCase().includes(cityFilter.trim().toLowerCase())) return false;
      if (countryFilter.trim() && !(b.country || "").toLowerCase().includes(countryFilter.trim().toLowerCase())) return false;
      if (verifiedOnly && ownerProfilesById[b.ownerUserId]?.status !== "verified") return false;

      if (search.trim()) {
        const haystack = `${b.businessName} ${b.ownerName} ${b.category} ${b.city} ${b.country} ${b.shortDescription}`.toLowerCase();
        if (!haystack.includes(search.trim().toLowerCase())) return false;
      }

      return true;
    });

    const sorted = [...filtered];
    if (sortBy === "newest") {
      sorted.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    } else if (sortBy === "name") {
      sorted.sort((a, b) => (a.businessName || "").localeCompare(b.businessName || ""));
    } else if (sortBy === "rating") {
      sorted.sort((a, b) => averageRating(b) - averageRating(a));
    } else {
      sorted.sort((a, b) => (b.featured === true) - (a.featured === true));
    }
    return sorted;
  }, [businesses, search, categoryFilter, cityFilter, countryFilter, verifiedOnly, sortBy, ownerProfilesById]);

  return (
    <div className="businesses-page">
      <section className="businesses-hero">
        <div className="businesses-overlay">
          <h1>Congolese Businesses</h1>
          <h3>Support Congolese entrepreneurs worldwide.</h3>

          <p>
            Discover businesses owned by Congolese entrepreneurs in Congo and
            across the diaspora.
          </p>

          {user && (
            <Link to="/businesses/create">
              <button>Create Business</button>
            </Link>
          )}
        </div>
      </section>

      <section className="businesses-section">
        <div className="businesses-filters">
          <input
            type="text"
            placeholder="Search by name, owner, category, or keyword…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search businesses"
          />
          <input
            type="text"
            placeholder="City…"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            aria-label="Filter by city"
          />
          <input
            type="text"
            placeholder="Country…"
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            aria-label="Filter by country"
          />

          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} aria-label="Filter by category">
            <option value="all">All Categories</option>
            {BUSINESS_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort businesses">
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>Sort: {o.label}</option>
            ))}
          </select>

          <label className="businesses-verified-toggle">
            <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} />
            Verified owners only
          </label>
        </div>

        <h2>Business Directory</h2>

        {error && <p className="register-form__error" role="alert">{error}</p>}

        <div className="cards">
          {loading ? (
            <>
              <BusinessCardSkeleton />
              <BusinessCardSkeleton />
              <BusinessCardSkeleton />
            </>
          ) : filteredBusinesses.length === 0 ? (
            <div className="card">
              <h3>No businesses match your search</h3>
              <p>Try adjusting your filters, or check back soon.</p>
            </div>
          ) : (
            filteredBusinesses.map((business) => (
              <div className="card" key={business.id}>
                {business.coverImageUrl && (
                  <img src={business.coverImageUrl} alt={business.businessName} className="businesses-card-image" />
                )}
                {business.featured && <span className="businesses-featured-badge">Featured</span>}
                {isOwnerVerified(business) && <span className="businesses-verified-badge">✓ Verified</span>}

                <Link to={`/businesses/${business.id}`}>
                  <h3>{business.businessName}</h3>
                </Link>
                <p><strong>Category:</strong> {business.category}</p>
                <p><strong>Location:</strong> {business.city}{business.city && business.country ? ", " : ""}{business.country}</p>
                {business.reviewCount > 0 && (
                  <p><strong>Rating:</strong> {averageRating(business).toFixed(1)} ★ ({business.reviewCount})</p>
                )}
                <p>{business.shortDescription?.slice(0, 140)}{business.shortDescription?.length > 140 ? "…" : ""}</p>

                <Link to={`/businesses/${business.id}`}>
                  <button>View Details</button>
                </Link>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default Businesses;
