import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Link } from "react-router-dom";

function Events() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const snapshot = await getDocs(collection(db, "events"));

        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setEvents(data);
      } catch (error) {
        console.error("Error loading events:", error);
      }
    };

    fetchEvents();
  }, []);

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

          <Link to="/create-event">
            <button>Create Event</button>
          </Link>
        </div>
      </section>

      <section className="events-section">
        <h2>Upcoming Events</h2>

        <div className="cards">
          {events.length === 0 ? (
            <div className="card">
              <h3>No events available</h3>

              <p>Be the first to publish an event.</p>

              <Link to="/create-event">
                <button>Create Event</button>
              </Link>
            </div>
          ) : (
            events.map((event) => (
              <div className="card" key={event.id}>
                <Link to={`/events/${event.id}`}>
                  <h3>{event.title}</h3>
                </Link>

                <p>
                  <strong>Organizer:</strong> {event.organizer}
                </p>

                <p>
                  <strong>Location:</strong> {event.location}
                </p>

                <p>
                  <strong>Date:</strong> {event.date}
                </p>

                <p>
                  <strong>Time:</strong> {event.time}
                </p>

                <p>{event.description}</p>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    marginTop: "15px",
                    flexWrap: "wrap",
                  }}
                >
                  <Link to={`/events/${event.id}`}>
                    <button>View Details</button>
                  </Link>

                  {event.link && (
                    <a
                      href={event.link}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <button>Register</button>
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default Events;