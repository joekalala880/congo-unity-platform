function EmergencyAlerts() {
  return (
    <section className="register-section">
      <div className="register-header">
        <h1>Emergency Alerts</h1>

        <p>
          Verified emergency alerts from Eastern Congo and across the country.
        </p>
      </div>

      <div className="cards">
        <div className="card">
          <h3>🚨 Goma</h3>
          <p>
            Security situation reported near Goma.
          </p>
        </div>

        <div className="card">
          <h3>🚨 Beni</h3>
          <p>
            Community warning issued.
          </p>
        </div>

        <div className="card">
          <h3>🚨 Ituri</h3>
          <p>
            Humanitarian assistance needed.
          </p>
        </div>
      </div>
    </section>
  );
}

export default EmergencyAlerts;