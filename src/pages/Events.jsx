import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { listPublishedEvents } from "../services/eventsService";
import { EVENT_CATEGORIES, ONLINE_OR_IN_PERSON } from "../services/eventTypes";
import "./Events.css";

function EventCardSkeleton() {
  return (
    <div className="card events-skeleton-card">
      <div className="events-skeleton" style={{ width: "60%", height: 20 }} />
      <div className="events-skeleton" style={{ width: "40%", height: 14, marginTop: 10 }} />
      <div className="events-skeleton" style={{ width: "90%", height: 12, marginTop: 14 }} />
    </div>
  );
}

// Event dates are stored as a plain "YYYY-MM-DD" string with no time
// component. new Date("2026-12-01") parses that as UTC midnight, which
// rolls back to the previous calendar day once displayed in any timezone
// behind UTC — appending a local midnight time avoids that.
function formatDate(value) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function Events() {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await listPublishedEvents();
        setEvents(data);
      } catch (err) {
        console.error("Failed to load events:", err);
        setError("We couldn't load events right now. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (categoryFilter !== "all" && event.category !== categoryFilter) return false;
      if (modeFilter !== "all" && event.onlineOrInPerson !== modeFilter) return false;
      if (cityFilter.trim() && !(event.city || "").toLowerCase().includes(cityFilter.trim().toLowerCase())) return false;
      if (countryFilter.trim() && !(event.country || "").toLowerCase().includes(countryFilter.trim().toLowerCase())) return false;
      if (dateFilter && event.date !== dateFilter) return false;

      if (search.trim()) {
        const haystack = `${event.title} ${event.organizerName} ${event.city} ${event.country} ${event.description}`.toLowerCase();
        if (!haystack.includes(search.trim().toLowerCase())) return false;
      }

      return true;
    });
  }, [events, search, categoryFilter, modeFilter, cityFilter, countryFilter, dateFilter]);

  return (
    <div className="events-page">
      <section className="events-hero">
        <div className="events-overlay">
          <h1>Events & Meetups</h1>
          <h3>Organize. Connect. Mobilize.</h3>

          <p>
            A place for Congolese protests, conferences, cultural festivals,
            student meetups, community gatherings, and diaspora events around
            the world.
          </p>

          {user && (
            <Link to="/events/create">
              <button>Create Event</button>
            </Link>
          )}
        </div>
      </section>

      <section className="events-section">
        <div className="events-filters">
          <input
            type="text"
            placeholder="Search by title, organizer, or keyword…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search events"
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
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            aria-label="Filter by date"
          />

          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} aria-label="Filter by category">
            <option value="all">All Categories</option>
            {EVENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select value={modeFilter} onChange={(e) => setModeFilter(e.target.value)} aria-label="Filter by online or in-person">
            <option value="all">Online / In-Person</option>
            {ONLINE_OR_IN_PERSON.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <h2>Upcoming Events</h2>

        {error && <p className="register-form__error" role="alert">{error}</p>}

        <div className="cards">
          {loading ? (
            <>
              <EventCardSkeleton />
              <EventCardSkeleton />
              <EventCardSkeleton />
            </>
          ) : filteredEvents.length === 0 ? (
            <div className="card">
              <h3>No events match your search</h3>
              <p>Try adjusting your filters, or check back soon.</p>
            </div>
          ) : (
            filteredEvents.map((event) => (
              <div className="card" key={event.id}>
                {event.imageUrl && <img src={event.imageUrl} alt={event.title} className="events-card-image" />}
                {event.featured && <span className="events-featured-badge">Featured</span>}

                <Link to={`/events/${event.id}`}>
                  <h3>{event.title}</h3>
                </Link>

                <p><strong>Organizer:</strong> {event.organizerName}</p>
                <p>
                  <strong>Location:</strong>{" "}
                  {event.onlineOrInPerson === "online" ? "Online" : `${event.city || ""}${event.city && event.country ? ", " : ""}${event.country || ""}`}
                </p>
                <p><strong>Date:</strong> {formatDate(event.date)} {event.startTime}</p>
                <p>{event.description?.slice(0, 140)}{event.description?.length > 140 ? "…" : ""}</p>

                <Link to={`/events/${event.id}`}>
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

export default Events;
