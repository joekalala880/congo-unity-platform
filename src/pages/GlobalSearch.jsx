import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Link } from "react-router-dom";

function GlobalSearch() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState({
    people: [],
    jobs: [],
    scholarships: [],
    events: [],
    news: [],
    businesses: [],
  });

  useEffect(() => {
    const fetchAllData = async () => {
      const peopleSnap = await getDocs(collection(db, "congoleseProfiles"));
      const jobsSnap = await getDocs(collection(db, "jobs"));
      const scholarshipsSnap = await getDocs(collection(db, "scholarships"));
      const eventsSnap = await getDocs(collection(db, "events"));
      const newsSnap = await getDocs(collection(db, "news"));
      const businessesSnap = await getDocs(collection(db, "businesses"));

      setResults({
        people: peopleSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        jobs: jobsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        scholarships: scholarshipsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        events: eventsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        news: newsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        businesses: businessesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      });
    };

    fetchAllData();
  }, []);

  const match = (item) => {
    const text = JSON.stringify(item).toLowerCase();
    return text.includes(search.toLowerCase());
  };

  const showResults = search.trim().length > 0;

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>Global Search</h1>
        <p>Search people, jobs, scholarships, events, news, and businesses.</p>
      </div>

      <div className="register-form">
        <input
          type="text"
          placeholder="Search Congo Unity..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {showResults && (
        <div className="cards">
          <div className="card">
            <h3>👤 People</h3>
            {results.people.filter(match).slice(0, 5).map((person) => (
              <p key={person.id}>
                <Link to={`/profile/${encodeURIComponent(person.email)}`}>
                  {person.firstName} {person.lastName}
                </Link>{" "}
                — {person.province}
              </p>
            ))}
          </div>

          <div className="card">
            <h3>💼 Jobs</h3>
            {results.jobs.filter(match).slice(0, 5).map((job) => (
              <p key={job.id}>
                <strong>{job.title}</strong> — {job.company}
              </p>
            ))}
          </div>

          <div className="card">
            <h3>🎓 Scholarships</h3>
            {results.scholarships.filter(match).slice(0, 5).map((item) => (
              <p key={item.id}>
                <strong>{item.title}</strong> — {item.organization}
              </p>
            ))}
          </div>

          <div className="card">
            <h3>📅 Events</h3>
            {results.events.filter(match).slice(0, 5).map((event) => (
              <p key={event.id}>
                <strong>{event.title}</strong> — {event.location}
              </p>
            ))}
          </div>

          <div className="card">
            <h3>📰 News</h3>
            {results.news.filter(match).slice(0, 5).map((item) => (
              <p key={item.id}>
                <strong>{item.title}</strong> — {item.category}
              </p>
            ))}
          </div>

          <div className="card">
            <h3>🏢 Businesses</h3>
            {results.businesses.filter(match).slice(0, 5).map((business) => (
              <p key={business.id}>
                <strong>{business.name}</strong> — {business.city}, {business.country}
              </p>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default GlobalSearch;