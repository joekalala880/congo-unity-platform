function Languages() {
  return (
    <div className="languages-page">
      <section className="languages-hero">
        <div className="languages-overlay">
          <h1>Languages</h1>
          <h3>One Congo. Many voices.</h3>

          <p>
            Congo Unity Platform will support French, English, Lingala, Swahili,
            Kikongo, and Tshiluba so Congolese people everywhere can participate.
          </p>
        </div>
      </section>

      <section className="languages-section">
        <h2>Supported Languages</h2>

        <div className="cards">
          <div className="card">
            <h3>French</h3>
            <p>Main national communication language for many Congolese users.</p>
          </div>

          <div className="card">
            <h3>English</h3>
            <p>For diaspora users, partners, students, and international support.</p>
          </div>

          <div className="card">
            <h3>Lingala</h3>
            <p>For cultural connection, community communication, and identity.</p>
          </div>

          <div className="card">
            <h3>Swahili</h3>
            <p>Important for eastern Congo and many communities across the region.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Languages;