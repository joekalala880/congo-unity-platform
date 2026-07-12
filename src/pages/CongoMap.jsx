import { useState } from "react";

function CongoMap() {
  const [selectedProvince, setSelectedProvince] = useState(null);

  const provinces = [
   {
  name: "Kinshasa",
  focus: "Capital, politics, diaspora connection",
  status: "Community Growth",
  members: 1250,
  issues: 84,
  donations: "$12,500",
},
    {
      name: "North Kivu",
      focus: "Security reports, displacement, crisis alerts",
      status: "High Priority",
      members: "Coming Soon",
      issues: "Coming Soon",
    },
    {
      name: "South Kivu",
      focus: "Humanitarian needs and community rebuilding",
      status: "High Priority",
      members: "Coming Soon",
      issues: "Coming Soon",
    },
    {
      name: "Ituri",
      focus: "Verified reports and emergency support",
      status: "High Priority",
      members: "Coming Soon",
      issues: "Coming Soon",
    },
    {
      name: "Kongo Central",
      focus: "Trade, diaspora return, community development",
      status: "Growing",
      members: "Coming Soon",
      issues: "Coming Soon",
    },
    {
      name: "Haut-Katanga",
      focus: "Minerals, economy, youth opportunity",
      status: "Strategic",
      members: "Coming Soon",
      issues: "Coming Soon",
    },
  ];

  return (
    <div className="map-page">
      <section className="map-hero">
        <div className="map-overlay">
          <h1>Congo Map</h1>
          <h3>Understand Congo province by province.</h3>

          <p>
            Click a province to view community focus, crisis priority, members,
            and reported issues.
          </p>
        </div>
      </section>

      <section className="map-section">
        <h2>Clickable Province Map</h2>

        <div className="province-map">
          {provinces.map((province) => (
            <button
              key={province.name}
              className="province-button"
              onClick={() => setSelectedProvince(province)}
            >
              {province.name}
            </button>
          ))}
        </div>

        {selectedProvince && (
          <div className="selected-province-card">
            <h2>{selectedProvince.name}</h2>

            <p>
              <strong>Focus:</strong> {selectedProvince.focus}
            </p>

            <p>
              <strong>Status:</strong> {selectedProvince.status}
            </p>

            <p>
              <strong>Members:</strong> {selectedProvince.members}
            </p>

            <p>
              <strong>Reported Issues:</strong> {selectedProvince.issues}
            </p>
            <p>
  <strong>Members:</strong> {selectedProvince.members}
</p>

<p>
  <strong>Reported Issues:</strong> {selectedProvince.issues}
</p>

<p>
  <strong>Donations:</strong> {selectedProvince.donations}
</p>
          </div>
        )}

        <h2>Province Overview</h2>

        <div className="cards province-cards">
          {provinces.map((province) => (
            <div className="card" key={province.name}>
              <h3>{province.name}</h3>
              <p>
                <strong>Focus:</strong> {province.focus}
              </p>
              <p>
                <strong>Status:</strong> {province.status}
              </p>
              <div className="national-stats">
  <div className="stat-card">
    <h3>Registered Citizens</h3>
    <p>15,000+</p>
  </div>

  <div className="stat-card">
    <h3>Diaspora Members</h3>
    <p>4,500+</p>
  </div>

  <div className="stat-card">
    <h3>Reported Issues</h3>
    <p>1,200+</p>
  </div>

  <div className="stat-card">
    <h3>Funds Raised</h3>
    <p>$250,000+</p>
  </div>
</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default CongoMap;