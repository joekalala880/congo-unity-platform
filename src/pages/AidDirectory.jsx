function AidDirectory() {
  const aidGroups = [
    {
      name: "Hospitals & Clinics",
      type: "Medical",
      location: "North Kivu / South Kivu / Ituri",
      status: "Verification Needed",
    },
    {
      name: "Shelters for Displaced Families",
      type: "Shelter",
      location: "Eastern Congo",
      status: "Verification Needed",
    },
    {
      name: "Food Assistance Groups",
      type: "Food Support",
      location: "Congo & Diaspora Partners",
      status: "Verification Needed",
    },
    {
      name: "Churches & Community Centers",
      type: "Community Support",
      location: "Local Communities",
      status: "Verification Needed",
    },
  ];

  return (
    <div className="aid-page">
      <section className="aid-hero">
        <div className="aid-overlay">
          <h1>Verified Aid Directory</h1>
          <h3>Find trusted help. Support verified partners.</h3>

          <p>
            A directory for hospitals, shelters, churches, schools, NGOs, and
            community groups helping Congolese people.
          </p>
        </div>
      </section>

      <section className="aid-section">
        <h2>Aid Organizations</h2>

        <div className="aid-grid">
          {aidGroups.map((group, index) => (
            <div className="aid-card" key={index}>
              <h3>{group.name}</h3>
              <p><strong>Type:</strong> {group.type}</p>
              <p><strong>Location:</strong> {group.location}</p>
              <p><strong>Status:</strong> {group.status}</p>
              <button>View Details</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default AidDirectory;