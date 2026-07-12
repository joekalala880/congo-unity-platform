function OSINTCenter() {
  return (
    <div className="osint-page">
      <section className="osint-hero">
        <div className="osint-overlay">
          <h1>OSINT Verification Center</h1>
          <h3>Verify before sharing. Truth protects people.</h3>

          <p>
            A verification hub for checking sensitive content, conflict reports,
            images, videos, locations, and timelines before publication.
          </p>
        </div>
      </section>

      <section className="osint-section">
        <h2>Verification Methods</h2>

        <div className="cards">
          <div className="card">
            <h3>Metadata Check</h3>
            <p>Review EXIF data, timestamps, device information, and location clues.</p>
          </div>

          <div className="card">
            <h3>Reverse Image Search</h3>
            <p>Check if an image or video has appeared online before.</p>
          </div>

          <div className="card">
            <h3>Geolocation</h3>
            <p>Compare buildings, roads, terrain, rivers, signs, and landmarks.</p>
          </div>

          <div className="card">
            <h3>Shadow Analysis</h3>
            <p>Use shadows and sun position to estimate time of day.</p>
          </div>

          <div className="card">
            <h3>Source Verification</h3>
            <p>Confirm reports with trusted journalists, witnesses, and local sources.</p>
          </div>

          <div className="card">
            <h3>Moderation Decision</h3>
            <p>Label content as Verified, Unconfirmed, or Debunked.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default OSINTCenter;