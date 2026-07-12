import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

function Directory() {
  const [profiles, setProfiles] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const querySnapshot = await getDocs(
          collection(db, "congoleseProfiles")
        );

        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setProfiles(data);
      } catch (error) {
        console.error("Error loading profiles:", error);
      }
    };

    fetchProfiles();
  }, []);

  const filteredProfiles = profiles.filter((profile) =>
    `${profile.firstName || ""} ${profile.lastName || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>Congolese Directory</h1>
        <p>View registered Congolese profiles.</p>
      </div>

      <input
        type="text"
        placeholder="Search by name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="search-input"
      />

      <div className="card">
        <h3>Total Members</h3>
        <p>{profiles.length}</p>
      </div>

      <div className="cards">
        {filteredProfiles.map((profile) => (
          <div className="card" key={profile.id}>
            <h3>
              {profile.firstName} {profile.lastName}
            </h3>

            <p>
              <strong>Province:</strong> {profile.province}
            </p>

            <p>
              <strong>Country:</strong> {profile.currentCountry}
            </p>

            <p>
              <strong>Status:</strong> {profile.status}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Directory;