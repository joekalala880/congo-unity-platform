import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { useEventImageUpload } from "../hooks/useEventImageUpload";
import {
  cancelEvent,
  closeRegistration,
  getEvent,
  getMeetingLink,
  submitForApproval,
  updateEventContent,
} from "../services/eventsService";
import { listAttendeesForEvent } from "../services/eventAttendeesService";
import { createNotification } from "../services/notificationService";
import {
  EVENT_CATEGORIES,
  EVENT_STATUS_LABELS,
  FREE_OR_PAID,
  ONLINE_OR_IN_PERSON,
  eventStatusBadgeSuffix,
} from "../services/eventTypes";
import "./CreateEvent.css";
import "./EditEvent.css";

function EditEvent() {
  const { eventId } = useParams();
  const [user, setUser] = useState(null);
  const [event, setEvent] = useState(null);
  const [fields, setFields] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const image = useEventImageUpload();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const eventData = await getEvent(eventId);
        setEvent(eventData);
        if (eventData) {
          const meetingLink = eventData.onlineOrInPerson === "online" ? await getMeetingLink(eventId) : "";
          setFields({
            title: eventData.title || "",
            description: eventData.description || "",
            category: eventData.category || EVENT_CATEGORIES[0],
            organizerName: eventData.organizerName || "",
            date: eventData.date || "",
            startTime: eventData.startTime || "",
            endTime: eventData.endTime || "",
            timeZone: eventData.timeZone || "",
            onlineOrInPerson: eventData.onlineOrInPerson || "in_person",
            venueName: eventData.venueName || "",
            address: eventData.address || "",
            city: eventData.city || "",
            country: eventData.country || "",
            meetingLink,
            capacity: eventData.capacity || "",
            freeOrPaid: eventData.freeOrPaid || "free",
            registrationLink: eventData.registrationLink || "",
            contactInformation: eventData.contactInformation || "",
            accessibilityInformation: eventData.accessibilityInformation || "",
          });
        }
      } catch (err) {
        console.error("Failed to load event:", err);
        setError("We couldn't load this event. Please try again.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [eventId]);

  const handleChange = (e) => {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const notifyAttendeesOfUpdate = async (message, type) => {
    try {
      const attendees = await listAttendeesForEvent(eventId);
      const active = attendees.filter((a) => a.status === "going" || a.status === "interested");
      await Promise.all(
        active.map((a) =>
          createNotification({
            to: a.userEmail,
            from: user.email,
            fromUserId: user.uid,
            type,
            message,
            relatedRoute: `/events/${eventId}`,
          })
        )
      );
    } catch (err) {
      console.error("Failed to notify attendees:", err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");

    if (!fields.title.trim() || !fields.description.trim()) {
      setError("Title and description are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl = event.imageUrl || "";
      if (image.file) {
        imageUrl = await image.uploadImage(user.uid);
      }

      await updateEventContent(eventId, { ...fields, imageUrl });
      setEvent((prev) => ({ ...prev, ...fields, imageUrl }));
      setSuccessMessage("Event updated.");
      setTimeout(() => setSuccessMessage(""), 4000);

      if (event.status === "published") {
        await notifyAttendeesOfUpdate(`"${fields.title}" was just updated by the organizer. Check the event page for details.`, "Event Updated");
      }
    } catch (err) {
      console.error("Failed to update event:", err);
      setError(err.message || "Couldn't update this event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitForApproval = async () => {
    try {
      await submitForApproval(eventId);
      setEvent((prev) => ({ ...prev, status: "pending_approval" }));
    } catch (err) {
      console.error("Failed to submit for approval:", err);
      setError("Couldn't submit this event for approval. Please try again.");
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Cancel this event? Attendees will be notified.")) return;

    try {
      await cancelEvent(eventId);
      setEvent((prev) => ({ ...prev, status: "cancelled" }));
      await notifyAttendeesOfUpdate(`"${event.title}" has been cancelled by the organizer.`, "Event Cancelled");
    } catch (err) {
      console.error("Failed to cancel event:", err);
      setError("Couldn't cancel this event. Please try again.");
    }
  };

  const handleToggleRegistration = async () => {
    try {
      await closeRegistration(eventId, !event.registrationClosed);
      setEvent((prev) => ({ ...prev, registrationClosed: !prev.registrationClosed }));
    } catch (err) {
      console.error("Failed to update registration:", err);
      setError("Couldn't update registration. Please try again.");
    }
  };

  if (loading) {
    return <section className="register-section"><p>Loading…</p></section>;
  }

  if (!user || !event || event.createdBy !== user.uid) {
    return (
      <section className="register-section">
        <div className="card">
          <h3>Event not found</h3>
          <p>This event doesn't exist or isn't yours to edit.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>Edit Event</h1>
        <span className={`editevent-badge editevent-badge-${eventStatusBadgeSuffix(event.status)}`}>
          {EVENT_STATUS_LABELS[event.status] || event.status}
        </span>
      </div>

      {event.status === "rejected" && event.rejectionReason && (
        <p className="register-form__error" role="alert">Rejected: {event.rejectionReason}</p>
      )}
      {successMessage && <p className="register-form__success" role="status">{successMessage}</p>}
      {error && <p className="register-form__error" role="alert">{error}</p>}

      <form className="register-form createevent-form" onSubmit={handleSave}>
        <label>
          <span>Event Title</span>
          <input name="title" value={fields.title} onChange={handleChange} />
        </label>

        <label>
          <span>Description</span>
          <textarea name="description" value={fields.description} onChange={handleChange} />
        </label>

        <label>
          <span>Organizer Name</span>
          <input name="organizerName" value={fields.organizerName} onChange={handleChange} />
        </label>

        <div className="createevent-grid">
          <label>
            <span>Category</span>
            <select name="category" value={fields.category} onChange={handleChange}>
              {EVENT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>

          <label>
            <span>Online or In-Person</span>
            <select name="onlineOrInPerson" value={fields.onlineOrInPerson} onChange={handleChange}>
              {ONLINE_OR_IN_PERSON.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>

          <label>
            <span>Date</span>
            <input type="date" name="date" value={fields.date} onChange={handleChange} />
          </label>

          <label>
            <span>Time Zone</span>
            <input name="timeZone" value={fields.timeZone} onChange={handleChange} />
          </label>

          <label>
            <span>Start Time</span>
            <input type="time" name="startTime" value={fields.startTime} onChange={handleChange} />
          </label>

          <label>
            <span>End Time</span>
            <input type="time" name="endTime" value={fields.endTime} onChange={handleChange} />
          </label>
        </div>

        {fields.onlineOrInPerson === "online" ? (
          <label>
            <span>Meeting Link</span>
            <input name="meetingLink" value={fields.meetingLink} onChange={handleChange} />
          </label>
        ) : (
          <div className="createevent-grid">
            <label><span>Venue Name</span><input name="venueName" value={fields.venueName} onChange={handleChange} /></label>
            <label><span>Address</span><input name="address" value={fields.address} onChange={handleChange} /></label>
            <label><span>City</span><input name="city" value={fields.city} onChange={handleChange} /></label>
            <label><span>Country</span><input name="country" value={fields.country} onChange={handleChange} /></label>
          </div>
        )}

        <div className="createevent-grid">
          <label><span>Capacity</span><input type="number" min="0" name="capacity" value={fields.capacity} onChange={handleChange} /></label>
          <label>
            <span>Free or Paid</span>
            <select name="freeOrPaid" value={fields.freeOrPaid} onChange={handleChange}>
              {FREE_OR_PAID.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </label>
        </div>

        <label><span>External Registration Link</span><input name="registrationLink" value={fields.registrationLink} onChange={handleChange} /></label>
        <label><span>Contact Information</span><input name="contactInformation" value={fields.contactInformation} onChange={handleChange} /></label>
        <label><span>Accessibility Information</span><input name="accessibilityInformation" value={fields.accessibilityInformation} onChange={handleChange} /></label>

        <label>
          <span>Event Image</span>
          {event.imageUrl && !image.previewUrl && <img src={event.imageUrl} alt="Current" className="createevent-image-preview" />}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => image.selectFile(e.target.files[0])} />
          {image.previewUrl && <img src={image.previewUrl} alt="Preview" className="createevent-image-preview" />}
        </label>

        <div className="createevent-actions">
          <button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving…" : "Save Changes"}</button>
          {event.status === "draft" && (
            <button type="button" onClick={handleSubmitForApproval}>Submit for Approval</button>
          )}
          {event.status === "published" && (
            <button type="button" onClick={handleToggleRegistration}>
              {event.registrationClosed ? "Reopen Registration" : "Close Registration"}
            </button>
          )}
          {(event.status === "published" || event.status === "pending_approval") && (
            <button type="button" onClick={handleCancel}>Cancel Event</button>
          )}
          <Link to="/my-events"><button type="button">Back to My Events</button></Link>
        </div>
      </form>
    </section>
  );
}

export default EditEvent;
