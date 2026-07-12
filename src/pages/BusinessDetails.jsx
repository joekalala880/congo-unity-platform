import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

function BusinessDetails() {
  const { id } = useParams();
  const [business, setBusiness] = useState(null);

  useEffect(() => {
    const fetchBusiness = async () => {
      const ref = doc(db, "businesses", id);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setBusiness({
          id: snap.id,
          ...snap.data(),
        });
      }
    };

    fetchBusiness();
  }, [id]);

  if (!business) {
    return (
      <section className="register-section">
        <h2>Loading business...</h2>
      </section>
    );
  }

  return (
    <section className="register-section">
      <div className="card">
        {business.imageUrl && (
          <img
            src={business.imageUrl}
            alt={business.name}
            className="post-image"
          />
        )}

        <h1>{business.name}</h1>

        <p><strong>Category:</strong> {business.category}</p>
        <p><strong>Country:</strong> {business.country}</p>
        <p><strong>City:</strong> {business.city}</p>
        <p><strong>Address:</strong> {business.address}</p>
        <p><strong>Phone:</strong> {business.phone}</p>
        <p><strong>Email:</strong> {business.email}</p>

        <h3>Description</h3>
        <p>{business.description}</p>

        {business.website && (
          <a href={business.website} target="_blank" rel="noreferrer">
            <button>Visit Website</button>
          </a>
        )}

        <Link to="/businesses">
          <button>Back to Businesses</button>
        </Link>
      </div>
    </section>
  );
}

export default BusinessDetails;