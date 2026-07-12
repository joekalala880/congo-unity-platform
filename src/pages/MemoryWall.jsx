function MemoryWall() {
  return (
    <div className="memory-page">
      <section className="memory-hero">
        <div className="memory-overlay">
          <h1>Memory Wall</h1>
          <h3>We remember. We honor. We refuse to forget.</h3>

          <p>
            A respectful space to preserve stories of victims, displaced
            families, orphans, widows, and communities affected by violence in
            eastern Congo.
          </p>
        </div>
      </section>

      <section className="memory-section">
        <h2>Stories of Memory</h2>

        <div className="cards">
          <div className="card">
            <h3>Victim Stories</h3>
            <p>
              Preserve names, testimonies, and memories with dignity and care.
            </p>
          </div>

          <div className="card">
            <h3>Displaced Families</h3>
            <p>
              Share stories of families forced to leave their homes and rebuild.
            </p>
          </div>

          <div className="card">
            <h3>The Abandoned</h3>
            <p>
              Honor orphans, widows, former child soldiers, and vulnerable
              communities needing support.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default MemoryWall;