import { Link } from "react-router-dom";

function TakeAction() {
  return (
    <div className="take-action-page">
      <section className="take-action-hero">
        <div className="take-action-overlay">
          <h1>Take Action</h1>
          <h3>Awareness becomes power when people organize.</h3>

          <p>
            A hub for petitions, medical drives, community campaigns, diaspora
            mobilization, and verified ways to support Congo.
          </p>

          <Link to="/report-issue">
            <button>Report an Issue</button>
          </Link>
        </div>
      </section>

      <section className="take-action-section">
        <h2>Ways to Help</h2>

        <div className="cards">
          <div className="card">
            <h3>Petitions</h3>
            <p>
              Organize petitions demanding peace, accountability, justice, and
              protection for affected communities.
            </p>
          </div>

          <div className="card">
            <h3>Medical Supply Drives</h3>
            <p>
              Coordinate support for hospitals, displaced families, mothers,
              children, and trauma survivors.
            </p>
          </div>

          <div className="card">
            <h3>Diaspora Campaigns</h3>
            <p>
              Mobilize Congolese communities in the USA, Canada, Europe, and
              Africa for awareness and action.
            </p>
          </div>

          <div className="card">
            <h3>Verified Support</h3>
            <p>
              Promote trusted community projects and future verified partners
              helping people on the ground.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default TakeAction;