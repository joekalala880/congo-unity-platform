import { Link } from "react-router-dom";
import "./GovernmentServices.css";

// Public menu page — no auth required to browse what's available; starting
// an actual application requires sign-in (enforced by ProtectedRoute on
// /government/services/birth-certificate).
function GovernmentServices() {
  return (
    <section className="register-section">
      <div className="register-header">
        <h1>Government Services</h1>
        <p>Request Congo Unity Platform services online.</p>
      </div>

      <p className="govsvc-disclaimer">
        These are Congo Unity Platform request workflows. Approval means approved within this
        platform's review process — the platform does not currently issue an official
        Democratic Republic of the Congo government document unless a specific government
        integration is announced.
      </p>

      <div className="govsvc-grid">
        <div className="govsvc-card">
          <h3>Birth Certificate Request</h3>
          <p>
            Request a Congo Unity birth certificate record using your verified Digital
            Identity, supporting documents, and birth/parent information.
          </p>
          <Link to="/government/services/birth-certificate">
            <button>Start Application</button>
          </Link>
        </div>

        <div className="govsvc-card govsvc-card-disabled">
          <h3>More services coming soon</h3>
          <p>Additional request workflows will be added here in future updates.</p>
        </div>
      </div>

      <div className="govsvc-links">
        <Link to="/government/applications">View My Applications</Link>
      </div>
    </section>
  );
}

export default GovernmentServices;
