import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

function CreateEvent() {
  const [event, setEvent] = useState({
    title: "",
    organizer: "",
    location: "",
    date: "",
    time: "",
    description: "",
    link: "",
  });

  const handleChange = (e) => {
    setEvent({
      ...event,
      [e.target.name]: e.target.value,
    });
  };

  const submitEvent = async (e) => {
    e.preventDefault();

    const user = auth.currentUser;

    if (!user) {
      alert("Please login first");
      return;
    }

    try {
      await addDoc(collection(db, "events"), {
        ...event,
        createdBy: user.email,
        createdAt: new Date(),
        status: "published",
      });

      alert("Event posted successfully!");

      setEvent({
        title: "",
        organizer: "",
        location: "",
        date: "",
        time: "",
        description: "",
        link: "",
      });
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>Create Event</h1>
        <p>Add community events, fundraisers, meetings, and diaspora programs.</p>
      </div>

      <form className="register-form" onSubmit={submitEvent}>
        <input
          name="title"
          value={event.title}
          onChange={handleChange}
          placeholder="Event Title"
        />

        <input
          name="organizer"
          value={event.organizer}
          onChange={handleChange}
          placeholder="Organizer"
        />

        <input
          name="location"
          value={event.location}
          onChange={handleChange}
          placeholder="Location"
        />

        <input
          name="date"
          value={event.date}
          onChange={handleChange}
          placeholder="Date"
        />

        <input
          name="time"
          value={event.time}
          onChange={handleChange}
          placeholder="Time"
        />

        <textarea
          name="description"
          value={event.description}
          onChange={handleChange}
          placeholder="Event Description"
        />

        <input
          name="link"
          value={event.link}
          onChange={handleChange}
          placeholder="Event Link"
        />

        <button type="submit">Publish Event</button>
      </form>
    </section>
  );
}

export default CreateEvent;