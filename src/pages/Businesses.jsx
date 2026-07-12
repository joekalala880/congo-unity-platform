import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Link } from "react-router-dom";

function Businesses() {
  const [businesses, setBusinesses] = useState([]);

  useEffect(() => {
    const fetchBusinesses = async () => {
      const snapshot = await getDocs(collection(db, "businesses"));

      const data = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      }));

      setBusinesses(data);
    };

    fetchBusinesses();
  }, []);

  return (
    <div className="businesses-page">
      <section className="businesses-hero">
        <div className="businesses-overlay">
          <h1>Congolese Businesses</h1>
          <h3>Support Congolese entrepreneurs worldwide.</h3>

          <p>
            Discover businesses owned by Congolese entrepreneurs in Congo and
            across the diaspora.
          </p>

          <Link to="/create-business">
            <button>Create Business</button>
          </Link>
        </div>
      </section>

      <section className="businesses-section">
        <h2>Business Directory</h2>

        <div className="cards">
          {businesses.length === 0 ? (
            <div className="card">
              <h3>No businesses posted yet</h3>
              <p>Create the first business listing.</p>
            </div>
          ) : (
            businesses.map((business) => (
              <div className="card" key={business.id}>
                {business.imageUrl && (
                  <img
                    src={business.imageUrl}
                    alt={business.name}
                    className="post-image"
                  />
                )}

              <Link to={`/businesses/${business.id}`}>
  <h3>{business.name}</h3>
</Link>
                <p><strong>Category:</strong> {business.category}</p>
                <p><strong>Country:</strong> {business.country}</p>
                <p><strong>City:</strong> {business.city}</p>
                <p><strong>Address:</strong> {business.address}</p>
                <p><strong>Phone:</strong> {business.phone}</p>
                <p><strong>Email:</strong> {business.email}</p>
                <p>{business.description}</p>

                {business.website && (
                  <a href={business.website} target="_blank" rel="noreferrer">
                    <button>Visit Website</button>
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default Businesses;