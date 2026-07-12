import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Link } from "react-router-dom";

function Announcements() {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const snapshot = await getDocs(collection(db, "announcements"));

        const data = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        setAnnouncements(data);
      } catch (error) {
        console.error("Error loading announcements:", error);
      }
    };

    fetchAnnouncements();
  }, []);

  return (
    <div className="announcements-page">
      <section className="announcements-hero">
        <div className="announcements-overlay">
          <h1>Announcements</h1>
          <h3>Stay informed. Stay connected.</h3>

          <p>
            Official community announcements, emergency alerts, events,
            fundraisers, and important updates for Congolese communities
            worldwide.
          </p>

          <Link to="/create-announcement">
            <button>Create Announcement</button>
          </Link>
        </div>
      </section>

      <section className="announcements-section">
        <h2>Latest Updates</h2>

        <div className="cards">
          {announcements.length === 0 ? (
            <div className="card">
              <h3>No announcements yet</h3>
              <p>Create your first announcement.</p>
            </div>
          ) : (
            announcements.map((item) => (
              <div className="card" key={item.id}>
                <h3>{item.title}</h3>

                <p>
                  <strong>Category:</strong> {item.category}
                </p>

                <p>{item.message}</p>

                <p>
                  <strong>Status:</strong> {item.status}
                </p>

                <p>
                  <strong>Created By:</strong> {item.createdBy}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default Announcements;