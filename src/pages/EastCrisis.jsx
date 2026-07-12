import { Link } from "react-router-dom";

function EastCrisis() {
  return (
    <div className="east-crisis-page">
      <section className="east-hero">
        <div className="east-overlay">
          <h1>The East in Crisis</h1>

          <h3>Ituri • North Kivu • South Kivu</h3>

          <p>
            A space to document suffering, verify reports, honor victims,
            support displaced families, and mobilize Congolese communities
            around the world.
          </p>

          <Link to="/report-issue">
            <button>Report a Verified Issue</button>
          </Link>
        </div>
      </section>

      <section className="crisis-section">
        <h2>Eastern Congo Crisis</h2>

        <div className="crisis-grid">
          <div className="crisis-card">
            <h3>Displaced People</h3>
            <p>7,000,000+</p>
          </div>

          <div className="crisis-card">
            <h3>Communities Affected</h3>
            <p>Ituri, North Kivu, South Kivu</p>
          </div>

          <div className="crisis-card">
            <h3>Verified Reports</h3>
            <p>Coming Soon</p>
          </div>

          <div className="crisis-card">
            <h3>Diaspora Support</h3>
            <p>Coming Soon</p>
          </div>
        </div>
      </section>

      <section className="east-content">
        <h2>What This Page Will Do</h2>

        <div className="cards">
          <div className="card">
            <h3>Verified Reports</h3>
            <p>
              Collect reports from affected areas and mark them as verified,
              unconfirmed, or debunked.
            </p>
          </div>

          <div className="card">
            <h3>Memory Wall</h3>
            <p>
              Honor victims, displaced families, orphans, widows, and
              communities affected by violence.
            </p>
          </div>

          <div className="card">
            <h3>Take Action</h3>
            <p>
              Help organize petitions, medical supply drives, awareness
              campaigns, and verified community support.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default EastCrisis;