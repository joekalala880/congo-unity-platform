import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getMissingPersonReport } from "../services/missingPersonsService";
import {
  CRISIS_DISCLAIMER,
  MISSING_PERSON_STATUS_LABELS,
  missingPersonStatusBadgeSuffix,
} from "../services/crisisTypes";
import "./Crisis.css";
import "./CrisisForms.css";

function MissingPersonDetails() {
  const { id } = useParams();
  const [mpCase, setMpCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getMissingPersonReport(id);
        setMpCase(data);
      } catch (err) {
        console.error("Failed to load missing person case:", err);
        setError("We couldn't load this case. It may not be public, or may not exist.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return <section className="register-section"><p>Loading…</p></section>;
  }

  if (error || !mpCase) {
    return (
      <section className="register-section">
        <div className="card">
          <h3>Case not found</h3>
          <p>{error || "This case doesn't exist or isn't public."}</p>
          <Link to="/crisis/missing-persons"><button type="button">Back to Missing Persons</button></Link>
        </div>
      </section>
    );
  }

  return (
    <section className="register-section">
      <div className="register-header">
        <span className={`crisis-status-badge crisis-status-${missingPersonStatusBadgeSuffix(mpCase.status)}`}>
          {MISSING_PERSON_STATUS_LABELS[mpCase.status] || mpCase.status}
        </span>
        <h1>{mpCase.name}</h1>
      </div>

      <div className="crisiscenter-disclaimer" role="alert">
        <strong>Important:</strong> {CRISIS_DISCLAIMER}
      </div>

      <div className="card">
        {mpCase.photoUrl && <img src={mpCase.photoUrl} alt={mpCase.name} className="crisiscenter-thumb" />}
        {mpCase.approximateAge && <p><strong>Approximate Age:</strong> {mpCase.approximateAge}</p>}
        {mpCase.gender && <p><strong>Gender:</strong> {mpCase.gender}</p>}
        {mpCase.lastSeenDate && <p><strong>Last Seen Date:</strong> {mpCase.lastSeenDate}</p>}
        <p><strong>Last Seen Location:</strong> {mpCase.lastSeenLocation}</p>
        {mpCase.clothingDescription && <p><strong>Clothing:</strong> {mpCase.clothingDescription}</p>}
        {mpCase.distinguishingFeatures && <p><strong>Distinguishing Features:</strong> {mpCase.distinguishingFeatures}</p>}
        {mpCase.safeContactMethod && (
          <p><strong>If you have information:</strong> {mpCase.safeContactMethod}</p>
        )}
      </div>

      <Link to="/crisis/missing-persons"><button type="button">Back to Missing Persons</button></Link>
    </section>
  );
}

export default MissingPersonDetails;
