import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

function EventDetails() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      const ref = doc(db, "events", id);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setEvent({
          id: snap.id,
          ...snap.data(),
        });
      }
    };

    fetchEvent();
  }, [id]);

  if (!event) {
    return (
      <section className="register-section">
        <h2>Loading event...</h2>
      </section>
    );
  }

  return (
    <section className="register-section">
      <div className="card">
        <h1>{event.title}</h1>

        <p><strong>Organizer:</strong> {event.organizer}</p>
        <p><strong>Location:</strong> {event.location}</p>
        <p><strong>Date:</strong> {event.date}</p>
        <p><strong>Time:</strong> {event.time}</p>

        <h3>Description</h3>
        <p>{event.description}</p>

        {event.link && (
          <a href={event.link} target="_blank" rel="noreferrer">
            <button>Visit Event</button>
          </a>
        )}

        <Link to="/events">
          <button>Back to Events</button>
        </Link>
      </div>
    </section>
  );
}

export default EventDetails;