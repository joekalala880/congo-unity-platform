import { Link } from "react-router-dom";

function DiasporaHub() {
  return (
    <div className="diaspora-page">
      <section className="diaspora-hero">
        <section className="crisis-section">
  <h2>Eastern Congo Crisis</h2>

  <div className="crisis-grid">

    <div className="crisis-card">
      <h3>Displaced People</h3>
      <p>7,000,000+</p>
    </div>

    <div className="crisis-card">
      <h3>Lives Lost</h3>
      <p>Thousands</p>
    </div>

    <div className="crisis-card">
      <h3>Communities Affected</h3>
      <p>North Kivu, South Kivu, Ituri</p>
    </div>

    <div className="crisis-card">
      <h3>Diaspora Mobilized</h3>
      <p>Coming Soon</p>
    </div>

  </div>
</section>
        <div className="diaspora-overlay">
          <h1>Diaspora Hub</h1>
          <h3>We are one, even when everything tries to divide us.</h3>
          <p>
            A global space for Congolese people abroad to connect, organize,
            share success stories, support Congo, and build unity.
          </p>

          <Link to="/register">
            <button>Join the Movement</button>
          </Link>
        </div>
      </section>

      <section className="diaspora-section">
        <h2>Global Congolese Community</h2>

        <div className="diaspora-grid">
          <div className="diaspora-card success">
            <div>
              <h3>Success Stories</h3>
              <p>Celebrate Congolese excellence around the world.</p>
            </div>
          </div>

          <div className="diaspora-card fundraisers">
            <div>
              <h3>Fundraisers</h3>
              <p>Support verified projects for families and communities.</p>
            </div>
          </div>

          <div className="diaspora-card events">
            <div>
              <h3>Events & Meetups</h3>
              <p>Find protests, conferences, fundraisers, and cultural events.</p>
            </div>
          </div>

          <div className="diaspora-card abandoned">
            <div>
              <h3>The Abandoned</h3>
              <p>Support orphans, widows, displaced families, and vulnerable people.</p>
            </div>
          </div>

          <div className="diaspora-card businesses">
            <div>
              <h3>Congolese Businesses</h3>
              <p>Promote businesses owned by Congolese in the diaspora.</p>
            </div>
          </div>

          <div className="diaspora-card global">
            <div>
              <h3>Global Community</h3>
              <p>Connect Congolese people across the USA, Canada, Europe, and Africa.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="diaspora-cta">
        <h2>Together, We Can Change Congo</h2>
        <p>
          The diaspora carries distance, pain, hope, and responsibility. This
          platform turns that energy into action.
        </p>

        <Link to="/report-issue">
          <button>Take Action</button>
        </Link>
      </section>
    </div>
  );
}

export default DiasporaHub;