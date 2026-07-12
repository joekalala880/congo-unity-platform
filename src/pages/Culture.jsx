function Culture() {
  return (
    <div className="culture-page">
      <section className="culture-hero">
        <div className="culture-overlay">
          <h1>Congo Culture & Heritage</h1>
          <h3>Our language. Our music. Our history. Our pride.</h3>

          <p>
            A cultural space celebrating Congolese identity, music, art,
            proverbs, history, food, languages, and traditions.
          </p>
        </div>
      </section>

      <section className="culture-section">
        <h2>Explore Congolese Culture</h2>

        <div className="cards">
          <div className="card">
            <h3>Music</h3>
            <p>Lingala, rumba, gospel, ndombolo, and modern Congolese sounds.</p>
          </div>

          <div className="card">
            <h3>Languages</h3>
            <p>Lingala, Swahili, Kikongo, Tshiluba, French, and diaspora voices.</p>
          </div>

          <div className="card">
            <h3>History</h3>
            <p>Learn about Congo’s past, resistance, leaders, and cultural memory.</p>
          </div>

          <div className="card">
            <h3>Art & Proverbs</h3>
            <p>Celebrate wisdom, creativity, fashion, poetry, and storytelling.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Culture;