function CrisisAlerts() {
  const alerts = [
    {
      province: "North Kivu",
      level: "HIGH",
      description:
        "Displacement and security concerns reported.",
    },
    {
      province: "South Kivu",
      level: "MEDIUM",
      description:
        "Community support and humanitarian assistance needed.",
    },
    {
      province: "Ituri",
      level: "HIGH",
      description:
        "Emergency response and verified reports required.",
    },
  ];

  return (
    <div className="alerts-page">
      <h1>🚨 Crisis Alerts Center</h1>

      <p>
        Verified crisis information, emergency updates,
        and humanitarian alerts.
      </p>

      <div className="cards">
        {alerts.map((alert, index) => (
          <div className="card" key={index}>
            <h2>{alert.province}</h2>

            <p>
              <strong>Alert Level:</strong>{" "}
              {alert.level}
            </p>

            <p>{alert.description}</p>

            <button>View Details</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CrisisAlerts;