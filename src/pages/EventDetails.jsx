import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import { getEvent, getMeetingLink } from "../services/eventsService";
import { cancelRsvp, getMyRsvp, setRsvp } from "../services/eventAttendeesService";
import { EVENT_REPORT_REASONS, RSVP_STATUS_LABELS } from "../services/eventTypes";
import "./EventDetails.css";

// Event dates are a plain "YYYY-MM-DD" string; appending a local midnight
// time avoids new Date() parsing it as UTC and rolling back a day in
// timezones behind UTC.
function formatDate(value) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function EventDetails() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [event, setEvent] = useState(null);
  const [meetingLink, setMeetingLink] = useState("");
  const [myRsvp, setMyRsvp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rsvpBusy, setRsvpBusy] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getEvent(id);
        setEvent(data);

        if (auth.currentUser) {
          const rsvp = await getMyRsvp(id, auth.currentUser.uid);
          setMyRsvp(rsvp);

          if (rsvp?.status === "going" && data?.onlineOrInPerson === "online") {
            const link = await getMeetingLink(id);
            setMeetingLink(link);
          }
        }
      } catch (err) {
        console.error("Failed to load event:", err);
        setError("We couldn't load this event right now. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, user]);

  const handleRsvp = async (status) => {
    if (!user) {
      alert("Please log in to RSVP.");
      return;
    }

    setRsvpBusy(true);
    setError("");
    try {
      const wasGoing = myRsvp?.status === "going";
      await setRsvp(user, event, status);
      setMyRsvp((prev) => ({ ...(prev || {}), status }));
      setEvent((prev) => ({
        ...prev,
        goingCount: (prev.goingCount || 0) + (status === "going" ? 1 : 0) - (wasGoing ? 1 : 0),
      }));
      setSuccessMessage(status === "going" ? "You're confirmed as Going!" : "Marked as Interested.");
      setTimeout(() => setSuccessMessage(""), 4000);

      if (status === "going" && event.onlineOrInPerson === "online") {
        const link = await getMeetingLink(id);
        setMeetingLink(link);
      }
    } catch (err) {
      console.error("Failed to RSVP:", err);
      setError(err.message || "Couldn't update your RSVP. Please try again.");
    } finally {
      setRsvpBusy(false);
    }
  };

  const handleCancelRsvp = async () => {
    if (!user || !window.confirm("Cancel your RSVP for this event?")) return;

    setRsvpBusy(true);
    setError("");
    try {
      const wasGoing = myRsvp?.status === "going";
      await cancelRsvp(user, event);
      setMyRsvp((prev) => ({ ...(prev || {}), status: "cancelled" }));
      if (wasGoing) {
        setEvent((prev) => ({ ...prev, goingCount: Math.max((prev.goingCount || 0) - 1, 0) }));
      }
      setMeetingLink("");
    } catch (err) {
      console.error("Failed to cancel RSVP:", err);
      setError("Couldn't cancel your RSVP. Please try again.");
    } finally {
      setRsvpBusy(false);
    }
  };

  const handleReport = async () => {
    if (!user) {
      alert("Please log in to report an event.");
      return;
    }

    const reasonInput = window.prompt(
      `Why are you reporting this event? Enter one of: ${EVENT_REPORT_REASONS.map((r) => r.value).join(", ")}`
    );
    if (reasonInput === null) return;

    const reason = EVENT_REPORT_REASONS.find((r) => r.value === reasonInput.trim().toLowerCase())?.value || "other";
    const message = window.prompt("Any additional details? (optional)") || "";

    try {
      await addDoc(collection(db, "eventReports"), {
        eventId: id,
        reporterId: user.uid,
        reporterEmail: user.email,
        reason,
        message,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      alert("Thanks — this event has been reported to our admin team.");
    } catch (err) {
      console.error("Failed to report event:", err);
      alert("Couldn't submit your report. Please try again.");
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: event.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setSuccessMessage("Link copied to clipboard.");
        setTimeout(() => setSuccessMessage(""), 4000);
      }
    } catch {
      // User cancelled the native share sheet — nothing to do.
    }
  };

  if (loading) {
    return <section className="register-section"><p className="evdet-loading">Loading event…</p></section>;
  }

  if (error || !event) {
    return (
      <section className="register-section">
        <div className="card">
          <h3>Event not found</h3>
          <p>{error || "This event doesn't exist or is no longer available."}</p>
          <Link to="/events"><button>Back to Events</button></Link>
        </div>
      </section>
    );
  }

  const remainingCapacity = event.capacity > 0 ? Math.max(event.capacity - (event.goingCount || 0), 0) : null;
  const isFull = event.capacity > 0 && (event.goingCount || 0) >= event.capacity;
  const canRsvp = event.status === "published" && !event.registrationClosed;
  const mapQuery = encodeURIComponent(`${event.venueName || ""} ${event.address || ""} ${event.city || ""} ${event.country || ""}`.trim());

  return (
    <section className="register-section">
      <div className="card evdet-card">
        {event.imageUrl && <img src={event.imageUrl} alt={event.title} className="evdet-image" />}
        {event.featured && <span className="events-featured-badge">Featured</span>}

        <h1>{event.title}</h1>
        <p><strong>Organizer:</strong> {event.organizerName}</p>
        <p><strong>Category:</strong> {event.category}</p>
        <p><strong>Date:</strong> {formatDate(event.date)} {event.startTime && `· ${event.startTime}`}{event.endTime && ` – ${event.endTime}`} {event.timeZone}</p>

        {event.onlineOrInPerson === "online" ? (
          <p><strong>Location:</strong> Online{myRsvp?.status === "going" && meetingLink ? <> — <a href={meetingLink} target="_blank" rel="noreferrer">{meetingLink}</a></> : " (link shared with confirmed attendees)"}</p>
        ) : (
          <>
            <p><strong>Venue:</strong> {event.venueName || "—"}</p>
            <p><strong>Address:</strong> {event.address || "—"}, {event.city} {event.country}</p>
            {mapQuery && <a href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`} target="_blank" rel="noreferrer">View on map</a>}
          </>
        )}

        <p><strong>Price:</strong> {event.freeOrPaid === "paid" ? "Paid" : "Free"}</p>
        {event.capacity > 0 && (
          <p><strong>Capacity:</strong> {event.goingCount || 0} / {event.capacity} going ({remainingCapacity} spot{remainingCapacity === 1 ? "" : "s"} left)</p>
        )}
        {event.contactInformation && <p><strong>Contact:</strong> {event.contactInformation}</p>}
        {event.accessibilityInformation && <p><strong>Accessibility:</strong> {event.accessibilityInformation}</p>}

        <h3>Description</h3>
        <p className="evdet-description">{event.description}</p>

        {event.registrationLink && (
          <a href={event.registrationLink} target="_blank" rel="noreferrer">
            <button type="button">External Registration</button>
          </a>
        )}

        {successMessage && <p className="register-form__success" role="status">{successMessage}</p>}
        {error && <p className="register-form__error" role="alert">{error}</p>}

        <div className="evdet-actions">
          {!user ? (
            <p><Link to="/login">Log in</Link> to RSVP.</p>
          ) : !canRsvp ? (
            <p className="evdet-closed-note">
              {event.status === "cancelled" ? "This event has been cancelled." : event.status === "completed" ? "This event has already taken place." : "Registration is closed for this event."}
            </p>
          ) : myRsvp && myRsvp.status !== "cancelled" ? (
            <>
              <span className="evdet-rsvp-badge">You're {RSVP_STATUS_LABELS[myRsvp.status]}</span>
              {myRsvp.status === "interested" && (
                <button type="button" onClick={() => handleRsvp("going")} disabled={rsvpBusy || isFull}>
                  {isFull ? "Event Full" : "Change to Going"}
                </button>
              )}
              <button type="button" onClick={handleCancelRsvp} disabled={rsvpBusy}>Cancel RSVP</button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => handleRsvp("going")} disabled={rsvpBusy || isFull}>
                {isFull ? "Event Full" : "RSVP Going"}
              </button>
              <button type="button" onClick={() => handleRsvp("interested")} disabled={rsvpBusy}>Interested</button>
            </>
          )}
        </div>

        <div className="evdet-actions">
          <button type="button" onClick={handleShare}>Share</button>
          {user && <button type="button" onClick={handleReport}>Report Event</button>}
          <Link to="/events"><button type="button">Back to Events</button></Link>
        </div>
      </div>
    </section>
  );
}

export default EventDetails;
