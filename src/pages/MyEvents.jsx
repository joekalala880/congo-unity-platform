import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { getEvent, listMyHostedEvents } from "../services/eventsService";
import { listAttendeesForEvent, listMyRsvps } from "../services/eventAttendeesService";
import { EVENT_STATUS_LABELS, eventStatusBadgeSuffix } from "../services/eventTypes";
import "./MyEvents.css";

// Event dates are a plain "YYYY-MM-DD" string; appending a local midnight
// time avoids new Date() parsing it as UTC and rolling back a day in
// timezones behind UTC.
function formatDate(value) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function isPast(dateStr) {
  if (!dateStr) return false;
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

function MyEvents() {
  const [user, setUser] = useState(null);
  const [hostedEvents, setHostedEvents] = useState([]);
  const [attendingEvents, setAttendingEvents] = useState([]);
  const [interestedEvents, setInterestedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedAttendeesFor, setExpandedAttendeesFor] = useState(null);
  const [attendeesByEvent, setAttendeesByEvent] = useState({});

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
        const hosted = await listMyHostedEvents(currentUser.uid);
        setHostedEvents(hosted);

        const rsvps = await listMyRsvps(currentUser.uid);
        const going = rsvps.filter((r) => r.status === "going");
        const interested = rsvps.filter((r) => r.status === "interested");

        const goingEventDocs = await Promise.all(going.map((r) => getEvent(r.eventId)));
        const interestedEventDocs = await Promise.all(interested.map((r) => getEvent(r.eventId)));

        setAttendingEvents(goingEventDocs.filter(Boolean));
        setInterestedEvents(interestedEventDocs.filter(Boolean));
      } catch (err) {
        console.error("Failed to load your events:", err);
        setError("We couldn't load your events right now. Please try again.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const toggleAttendees = async (eventId) => {
    if (expandedAttendeesFor === eventId) {
      setExpandedAttendeesFor(null);
      return;
    }

    setExpandedAttendeesFor(eventId);
    if (!attendeesByEvent[eventId]) {
      try {
        const attendees = await listAttendeesForEvent(eventId);
        setAttendeesByEvent((prev) => ({ ...prev, [eventId]: attendees.filter((a) => a.status !== "cancelled") }));
      } catch (err) {
        console.error("Failed to load attendees:", err);
      }
    }
  };

  const upcomingHosted = hostedEvents.filter((e) => !isPast(e.date));
  const pastHosted = hostedEvents.filter((e) => isPast(e.date));
  const upcomingAttending = attendingEvents.filter((e) => !isPast(e.date));
  const pastAttending = attendingEvents.filter((e) => isPast(e.date));

  if (loading) {
    return <section className="register-section"><p>Loading…</p></section>;
  }

  if (!user) {
    return (
      <section className="register-section">
        <div className="register-header">
          <h1>My Events</h1>
          <p>Please log in to view your events.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>My Events</h1>
        <p>Events you're hosting, attending, and interested in.</p>
      </div>

      <div className="myevents-actions">
        <Link to="/events"><button>Browse Events</button></Link>
        <Link to="/events/create"><button>Create Event</button></Link>
      </div>

      {error && <p className="register-form__error" role="alert">{error}</p>}

      <h2>Hosting ({upcomingHosted.length})</h2>
      {upcomingHosted.length === 0 ? (
        <p className="myevents-empty">You aren't hosting any upcoming events.</p>
      ) : (
        <div className="myevents-list">
          {upcomingHosted.map((event) => (
            <div className="card myevents-row" key={event.id}>
              <div className="myevents-row-title">
                <Link to={`/events/${event.id}`}><strong>{event.title}</strong></Link>
                <span className={`myevents-badge myevents-badge-${eventStatusBadgeSuffix(event.status)}`}>
                  {EVENT_STATUS_LABELS[event.status] || event.status}
                </span>
              </div>
              <p className="myevents-meta">{formatDate(event.date)} · {event.goingCount || 0} going</p>

              <div className="myevents-row-actions">
                <Link to={`/events/${event.id}/edit`}><button type="button">Edit</button></Link>
                <button type="button" onClick={() => toggleAttendees(event.id)}>
                  {expandedAttendeesFor === event.id ? "Hide Attendees" : "View Attendees"}
                </button>
              </div>

              {expandedAttendeesFor === event.id && (
                <div className="myevents-attendees">
                  {!attendeesByEvent[event.id] ? (
                    <p>Loading attendees…</p>
                  ) : attendeesByEvent[event.id].length === 0 ? (
                    <p>No RSVPs yet.</p>
                  ) : (
                    attendeesByEvent[event.id].map((a) => (
                      <p key={a.id}>{a.userName || a.userEmail} — {a.status === "going" ? "Going" : "Interested"}</p>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <h2>Attending ({upcomingAttending.length})</h2>
      {upcomingAttending.length === 0 ? (
        <p className="myevents-empty">You haven't RSVP'd Going to any upcoming events.</p>
      ) : (
        <div className="myevents-list">
          {upcomingAttending.map((event) => (
            <Link to={`/events/${event.id}`} className="card myevents-row" key={event.id}>
              <strong>{event.title}</strong>
              <p className="myevents-meta">{formatDate(event.date)}</p>
            </Link>
          ))}
        </div>
      )}

      <h2>Interested ({interestedEvents.length})</h2>
      {interestedEvents.length === 0 ? (
        <p className="myevents-empty">No events marked Interested.</p>
      ) : (
        <div className="myevents-list">
          {interestedEvents.map((event) => (
            <Link to={`/events/${event.id}`} className="card myevents-row" key={event.id}>
              <strong>{event.title}</strong>
              <p className="myevents-meta">{formatDate(event.date)}</p>
            </Link>
          ))}
        </div>
      )}

      {(pastHosted.length > 0 || pastAttending.length > 0) && (
        <>
          <h2>Past Events</h2>
          <div className="myevents-list">
            {[...pastHosted, ...pastAttending].map((event) => (
              <Link to={`/events/${event.id}`} className="card myevents-row myevents-row-past" key={event.id}>
                <strong>{event.title}</strong>
                <p className="myevents-meta">{formatDate(event.date)}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default MyEvents;
