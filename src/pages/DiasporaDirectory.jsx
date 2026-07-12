function DiasporaDirectory() {
  const communities = [
    {
      country: "United States",
      flag: "🇺🇸",
      members: "Coming Soon",
      cities: "New York, Atlanta, Washington DC, Portland, Dallas",
    },
    {
      country: "Canada",
      flag: "🇨🇦",
      members: "Coming Soon",
      cities: "Toronto, Montreal, Ottawa",
    },
    {
      country: "France",
      flag: "🇫🇷",
      members: "Coming Soon",
      cities: "Paris, Lyon, Marseille",
    },
    {
      country: "Belgium",
      flag: "🇧🇪",
      members: "Coming Soon",
      cities: "Brussels, Antwerp, Liège",
    },
    {
      country: "United Kingdom",
      flag: "🇬🇧",
      members: "Coming Soon",
      cities: "London, Manchester, Birmingham",
    },
    {
      country: "South Africa",
      flag: "🇿🇦",
      members: "Coming Soon",
      cities: "Johannesburg, Cape Town, Pretoria",
    },
  ];

  return (
    <div className="diaspora-directory-page">
      <section className="diaspora-directory-hero">
        <div className="diaspora-directory-overlay">
          <h1>Global Diaspora Directory</h1>
          <h3>Congolese communities across the world.</h3>

          <p>
            Find Congolese communities, events, fundraisers, organizations,
            and leaders across the global diaspora.
          </p>
        </div>
      </section>

      <section className="diaspora-directory-section">
        <h2>Communities by Country</h2>

        <div className="aid-grid">
          {communities.map((community, index) => (
            <div className="aid-card" key={index}>
              <h3>
                {community.flag} {community.country}
              </h3>

              <p>
                <strong>Members:</strong> {community.members}
              </p>

              <p>
                <strong>Cities:</strong> {community.cities}
              </p>

              <button>View Community</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default DiasporaDirectory;