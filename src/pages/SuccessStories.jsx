function SuccessStories() {
  return (
    <div className="success-page">
      <section className="success-hero">
        <div className="success-overlay">
          <h1>Success Stories</h1>
          <h3>Congolese excellence around the world.</h3>

          <p>
            A space to celebrate Congolese students, entrepreneurs, artists,
            healthcare workers, engineers, community leaders, and families
            building a better future.
          </p>
        </div>
      </section>

      <section className="success-section">
        <h2>Featured Stories</h2>

        <div className="cards">
          <div className="card">
            <h3>Students Abroad</h3>
            <p>
              Highlight Congolese students succeeding in universities around the
              world.
            </p>
          </div>

          <div className="card">
            <h3>Entrepreneurs</h3>
            <p>
              Celebrate Congolese business owners building companies and creating
              jobs.
            </p>
          </div>

          <div className="card">
            <h3>Artists & Voices</h3>
            <p>
              Share stories of musicians, writers, filmmakers, and creators
              speaking truth through art.
            </p>
          </div>

          <div className="card">
            <h3>Community Leaders</h3>
            <p>
              Recognize people organizing, mentoring, serving, and rebuilding
              communities.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default SuccessStories;