import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, doc, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { auth, db } from "../firebase";
import { listPublishedJobs } from "../services/jobsService";
import { EXPERIENCE_LEVELS, JOB_CATEGORIES, JOB_TYPES, LOCATION_TYPES } from "../services/jobTypes";
import "./Jobs.css";

function JobCardSkeleton() {
  return (
    <div className="card jobs-skeleton-card">
      <div className="jobs-skeleton" style={{ width: "60%", height: 20 }} />
      <div className="jobs-skeleton" style={{ width: "40%", height: 14, marginTop: 10 }} />
      <div className="jobs-skeleton" style={{ width: "90%", height: 12, marginTop: 14 }} />
      <div className="jobs-skeleton" style={{ width: "80%", height: 12, marginTop: 6 }} />
    </div>
  );
}

function Jobs() {
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [savedJobIds, setSavedJobIds] = useState({}); // jobId -> savedItems doc id
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [locationTypeFilter, setLocationTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [experienceFilter, setExperienceFilter] = useState("all");
  const [locationSearch, setLocationSearch] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await listPublishedJobs();
        setJobs(data);
      } catch (err) {
        console.error("Failed to load jobs:", err);
        setError("We couldn't load jobs right now. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    // No user means nothing to fetch — savedJobIds simply stays unread from
    // this path (toggleSave() and the "★ Saved" display both already gate
    // on `user`, so a stale map for a since-logged-out session is never
    // shown or acted on).
    if (!user) return;

    (async () => {
      try {
        const snapshot = await getDocs(
          query(collection(db, "savedItems"), where("userEmail", "==", user.email), where("type", "==", "job"))
        );
        const map = {};
        snapshot.docs.forEach((d) => {
          if (d.data().removed !== true) map[d.data().jobId] = d.id;
        });
        setSavedJobIds(map);
      } catch (err) {
        console.error("Failed to load saved jobs:", err);
      }
    })();
  }, [user]);

  const toggleSave = async (job) => {
    if (!user) {
      alert("Please log in to save jobs.");
      return;
    }

    try {
      const existingId = savedJobIds[job.id];
      if (existingId) {
        await updateDoc(doc(db, "savedItems", existingId), { removed: true });
        setSavedJobIds((prev) => {
          const next = { ...prev };
          delete next[job.id];
          return next;
        });
      } else {
        const ref = await addDoc(collection(db, "savedItems"), {
          userEmail: user.email,
          type: "job",
          jobId: job.id,
          title: job.title,
          description: `${job.companyName} · ${job.location || "Remote"}`,
          link: `/jobs/${job.id}`,
          removed: false,
          createdAt: serverTimestamp(),
        });
        setSavedJobIds((prev) => ({ ...prev, [job.id]: ref.id }));
      }
    } catch (err) {
      console.error("Failed to save/unsave job:", err);
    }
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (typeFilter !== "all" && job.type !== typeFilter) return false;
      if (locationTypeFilter !== "all" && job.locationType !== locationTypeFilter) return false;
      if (categoryFilter !== "all" && job.category !== categoryFilter) return false;
      if (experienceFilter !== "all" && job.experienceLevel !== experienceFilter) return false;

      if (locationSearch.trim()) {
        const loc = (job.location || "").toLowerCase();
        if (!loc.includes(locationSearch.trim().toLowerCase())) return false;
      }

      if (search.trim()) {
        const haystack = `${job.title} ${job.companyName} ${job.description}`.toLowerCase();
        if (!haystack.includes(search.trim().toLowerCase())) return false;
      }

      return true;
    });
  }, [jobs, search, typeFilter, locationTypeFilter, categoryFilter, experienceFilter, locationSearch]);

  return (
    <div className="jobs-page">
      <section className="jobs-hero">
        <div className="jobs-overlay">
          <h1>Jobs Board</h1>
          <h3>Opportunities for Congolese people worldwide.</h3>

          <p>
            A space for jobs, internships, mentorship, and career opportunities
            for Congolese communities in Congo and the diaspora.
          </p>

          {user && (
            <Link to="/create-job">
              <button>Post a Job</button>
            </Link>
          )}
        </div>
      </section>

      <section className="jobs-section">
        <div className="jobs-filters">
          <input
            type="text"
            placeholder="Search by title, company, or keyword…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search jobs"
          />
          <input
            type="text"
            placeholder="Location…"
            value={locationSearch}
            onChange={(e) => setLocationSearch(e.target.value)}
            aria-label="Search by location"
          />

          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} aria-label="Filter by job type">
            <option value="all">All Job Types</option>
            {JOB_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} aria-label="Filter by category">
            <option value="all">All Categories</option>
            {JOB_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select value={locationTypeFilter} onChange={(e) => setLocationTypeFilter(e.target.value)} aria-label="Filter by remote or on-site">
            <option value="all">Remote / On-site</option>
            {LOCATION_TYPES.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>

          <select value={experienceFilter} onChange={(e) => setExperienceFilter(e.target.value)} aria-label="Filter by experience level">
            <option value="all">All Experience Levels</option>
            {EXPERIENCE_LEVELS.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>

        <h2>Latest Opportunities</h2>

        {error && <p className="register-form__error" role="alert">{error}</p>}

        <div className="cards">
          {loading ? (
            <>
              <JobCardSkeleton />
              <JobCardSkeleton />
              <JobCardSkeleton />
            </>
          ) : filteredJobs.length === 0 ? (
            <div className="card">
              <h3>No jobs match your search</h3>
              <p>Try adjusting your filters, or check back soon for new opportunities.</p>
            </div>
          ) : (
            filteredJobs.map((job) => (
              <div className="card" key={job.id}>
                <Link to={`/jobs/${job.id}`}>
                  <h3>{job.title}</h3>
                </Link>
                <p><strong>Company:</strong> {job.companyName}</p>
                <p><strong>Location:</strong> {job.location || "—"} {job.locationType ? `(${job.locationType})` : ""}</p>
                <p><strong>Type:</strong> {job.type || "—"}</p>
                <p>{job.description?.slice(0, 160)}{job.description?.length > 160 ? "…" : ""}</p>

                <div className="jobs-card-actions">
                  <Link to={`/jobs/${job.id}`}>
                    <button>View & Apply</button>
                  </Link>
                  <button type="button" onClick={() => toggleSave(job)} className="jobs-save-button">
                    {user && savedJobIds[job.id] ? "★ Saved" : "☆ Save"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default Jobs;
