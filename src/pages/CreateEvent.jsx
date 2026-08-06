import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { useEventImageUpload } from "../hooks/useEventImageUpload";
import { createEvent } from "../services/eventsService";
import { EVENT_CATEGORIES, FREE_OR_PAID, ONLINE_OR_IN_PERSON } from "../services/eventTypes";
import "./CreateEvent.css";

const EMPTY_FIELDS = {
  title: "",
  description: "",
  category: EVENT_CATEGORIES[0],
  organizerName: "",
  date: "",
  startTime: "",
  endTime: "",
  timeZone: "",
  onlineOrInPerson: "in_person",
  venueName: "",
  address: "",
  city: "",
  country: "",
  meetingLink: "",
  capacity: "",
  freeOrPaid: "free",
  registrationLink: "",
  contactInformation: "",
  accessibilityInformation: "",
};

function CreateEvent() {
  const navigate = useNavigate();
  const [fields, setFields] = useState(EMPTY_FIELDS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const image = useEventImageUpload();

  const user = auth.currentUser;

  const handleChange = (e) => {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    if (!fields.title.trim() || !fields.description.trim()) return "Title and description are required.";
    if (!fields.organizerName.trim()) return "Organizer name is required.";
    if (!fields.date) return "Event date is required.";
    if (fields.onlineOrInPerson === "in_person" && !fields.city.trim()) return "City is required for in-person events.";
    if (fields.onlineOrInPerson === "online" && !fields.meetingLink.trim()) return "A meeting link is required for online events.";
    return "";
  };

  const submit = async (submitForApproval) => {
    setError("");
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!user) {
      alert("Please log in to create an event.");
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl = "";
      if (image.file) {
        imageUrl = await image.uploadImage(user.uid);
      }

      await createEvent(user, { ...fields, imageUrl }, { submitForApproval });
      alert(
        submitForApproval
          ? "Event submitted for admin approval. You'll be notified once it's reviewed."
          : "Draft saved. You can find it under My Events."
      );
      navigate("/my-events");
    } catch (err) {
      console.error("Failed to create event:", err);
      setError(err.message || "Couldn't create this event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <section className="register-section">
        <div className="register-header">
          <h1>Create Event</h1>
          <p>Please log in to create an event.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>Create Event</h1>
        <p>Add community events, fundraisers, meetings, and diaspora programs. New events are reviewed by an admin before going live.</p>
      </div>

      <form className="register-form createevent-form" onSubmit={(e) => e.preventDefault()}>
        {error && <p className="register-form__error" role="alert">{error}</p>}

        <label>
          <span>Event Title</span>
          <input name="title" value={fields.title} onChange={handleChange} placeholder="Event Title" />
        </label>

        <label>
          <span>Description</span>
          <textarea name="description" value={fields.description} onChange={handleChange} placeholder="Event Description" />
        </label>

        <label>
          <span>Organizer Name</span>
          <input name="organizerName" value={fields.organizerName} onChange={handleChange} placeholder="Organizer Name" />
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
            <input name="timeZone" value={fields.timeZone} onChange={handleChange} placeholder="e.g. WAT, EST" />
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
            <input name="meetingLink" value={fields.meetingLink} onChange={handleChange} placeholder="https://…" />
            <span className="createevent-hint">Only shared with attendees who RSVP Going.</span>
          </label>
        ) : (
          <div className="createevent-grid">
            <label>
              <span>Venue Name</span>
              <input name="venueName" value={fields.venueName} onChange={handleChange} />
            </label>
            <label>
              <span>Address</span>
              <input name="address" value={fields.address} onChange={handleChange} />
            </label>
            <label>
              <span>City</span>
              <input name="city" value={fields.city} onChange={handleChange} />
            </label>
            <label>
              <span>Country</span>
              <input name="country" value={fields.country} onChange={handleChange} />
            </label>
          </div>
        )}

        <div className="createevent-grid">
          <label>
            <span>Capacity (optional)</span>
            <input type="number" min="0" name="capacity" value={fields.capacity} onChange={handleChange} placeholder="Leave blank for unlimited" />
          </label>

          <label>
            <span>Free or Paid</span>
            <select name="freeOrPaid" value={fields.freeOrPaid} onChange={handleChange}>
              {FREE_OR_PAID.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </label>
        </div>

        <label>
          <span>External Registration/Ticket Link (optional)</span>
          <input name="registrationLink" value={fields.registrationLink} onChange={handleChange} placeholder="https://…" />
        </label>

        <label>
          <span>Contact Information (optional)</span>
          <input name="contactInformation" value={fields.contactInformation} onChange={handleChange} />
        </label>

        <label>
          <span>Accessibility Information (optional)</span>
          <input name="accessibilityInformation" value={fields.accessibilityInformation} onChange={handleChange} />
        </label>

        <label>
          <span>Event Image (optional)</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => image.selectFile(e.target.files[0])} />
          {image.previewUrl && <img src={image.previewUrl} alt="Preview" className="createevent-image-preview" />}
          {image.error && <p className="register-form__error" role="alert">{image.error}</p>}
        </label>

        <div className="createevent-actions">
          <button type="button" onClick={() => submit(false)} disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save Draft"}
          </button>
          <button type="button" onClick={() => submit(true)} disabled={isSubmitting}>
            {isSubmitting ? (image.isUploading ? `Uploading… ${image.uploadProgress}%` : "Submitting…") : "Submit for Approval"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default CreateEvent;
