function EmergencyResponse() {
  return (
    <div className="emergency-page">
      <section className="emergency-hero">
        <div className="emergency-overlay">
          <h1>Emergency Response Center</h1>
          <h3>Fast help. Verified resources. Community protection.</h3>

          <p>
            A future hub for shelters, hospitals, hotlines, verified aid groups,
            emergency contacts, and crisis support for Congolese communities.
          </p>
        </div>
      </section>

      <section className="emergency-section">
        <h2>Emergency Resources</h2>

        <div className="emergency-grid">
  <div className="emergency-card">
    <h3>Hospitals & Clinics</h3>
    <p>Verified medical centers and emergency care contacts.</p>
  </div>

  <div className="emergency-card">
    <h3>Shelters</h3>
    <p>Safe locations for displaced families and vulnerable people.</p>
  </div>

  <div className="emergency-card">
    <h3>Aid Organizations</h3>
    <p>Trusted organizations helping communities on the ground.</p>
  </div>

  <div className="emergency-card">
    <h3>Emergency Contacts</h3>
    <p>Hotlines and local emergency support contacts.</p>
  </div>
</div>
      </section>
    </div>
  );
}

export default EmergencyResponse;