import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { listMyBusinesses } from "../services/businessesService";
import { BUSINESS_STATUS_LABELS, businessStatusBadgeSuffix } from "../services/businessTypes";
import "./MyBusinesses.css";

function MyBusinesses() {
  const [user, setUser] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const data = await listMyBusinesses(currentUser.uid);
        setBusinesses(data);
      } catch (err) {
        console.error("Failed to load your businesses:", err);
        setError("We couldn't load your businesses right now. Please try again.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>My Businesses</h1>
        <p>Manage the businesses you've listed.</p>
      </div>

      <div className="mybiz-actions">
        <Link to="/businesses/create"><button>Create a Business</button></Link>
      </div>

      {error && <p className="register-form__error" role="alert">{error}</p>}

      {loading ? (
        <p>Loading…</p>
      ) : !user ? (
        <p>Please log in to manage your businesses.</p>
      ) : businesses.length === 0 ? (
        <div className="card">
          <h3>No businesses yet</h3>
          <p>Create your first business listing for the Congo Unity community.</p>
        </div>
      ) : (
        <div className="mybiz-list">
          {businesses.map((business) => (
            <div className="card mybiz-row" key={business.id}>
              <div className="mybiz-row-title">
                <strong>{business.businessName}</strong>
                <span className={`bizowner-badge bizowner-badge-${businessStatusBadgeSuffix(business.status)}`}>
                  {BUSINESS_STATUS_LABELS[business.status] || business.status}
                </span>
              </div>
              <p>{business.category} · {business.city}</p>
              {business.status === "rejected" && business.adminMessage && (
                <p className="mybiz-rejection">Rejected: {business.adminMessage}</p>
              )}
              {business.reviewCount > 0 && (
                <p className="mybiz-meta">{(business.ratingSum / business.reviewCount).toFixed(1)} ★ ({business.reviewCount} reviews)</p>
              )}

              <div className="mybiz-row-actions">
                {business.status === "approved" && (
                  <Link to={`/businesses/${business.id}`}><button type="button">View</button></Link>
                )}
                <Link to={`/businesses/${business.id}/edit`}><button type="button">Edit</button></Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default MyBusinesses;
