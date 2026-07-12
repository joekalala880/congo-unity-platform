function Volunteer() {
  return (
    <div className="volunteer-page">
      <section className="volunteer-hero">
        <div className="volunteer-overlay">
          <h1>Volunteer Opportunities</h1>
          <h3>Serve Congo from anywhere in the world.</h3>

          <p>
            Connect volunteers with community projects, translation help,
            fundraising, mentoring, education, medical support, and awareness
            campaigns.
          </p>
        </div>
      </section>

      <section className="volunteer-section">
        <h2>Ways to Volunteer</h2>

        <div className="cards">
          <div className="card">
            <h3>Mentorship</h3>
            <p>Support Congolese students, youth, and new arrivals.</p>
          </div>

          <div className="card">
            <h3>Translation</h3>
            <p>Help translate resources in French, English, Lingala, and Swahili.</p>
          </div>

          <div className="card">
            <h3>Fundraising Team</h3>
            <p>Help organize campaigns and community support drives.</p>
          </div>

          <div className="card">
            <h3>Media & Awareness</h3>
            <p>Create posts, videos, graphics, and campaigns to support Congo.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Volunteer;