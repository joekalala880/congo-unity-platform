function Partners() {
  const partners = [
    {
      name: "Local Journalists",
      type: "Media / Verification",
      role: "Help verify reports, testimonies, and crisis updates.",
    },
    {
      name: "Churches & Community Leaders",
      type: "Community Support",
      role: "Support families, organize aid, and connect local communities.",
    },
    {
      name: "Humanitarian Organizations",
      type: "Aid / Emergency",
      role: "Provide medical, food, shelter, and emergency support.",
    },
    {
      name: "Diaspora Associations",
      type: "Diaspora Network",
      role: "Mobilize fundraisers, events, protests, and awareness campaigns.",
    },
  ];

  return (
    <div className="partners-page">
      <section className="partners-hero">
        <div className="partners-overlay">
          <h1>Verified Partners</h1>
          <h3>Trusted people. Trusted organizations. Trusted action.</h3>

          <p>
            A future network of journalists, NGOs, churches, community leaders,
            diaspora groups, and organizations supporting Congo Unity Platform.
          </p>
        </div>
      </section>

      <section className="partners-section">
        <h2>Partner Categories</h2>

        <div className="aid-grid">
          {partners.map((partner, index) => (
            <div className="aid-card" key={index}>
              <h3>{partner.name}</h3>
              <p><strong>Type:</strong> {partner.type}</p>
              <p>{partner.role}</p>
              <button>Apply to Partner</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Partners;