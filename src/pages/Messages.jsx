function Messages() {
  return (
    <div className="messages-page">
      <section className="messages-hero">
        <div className="messages-overlay">
          <h1>Messages</h1>
          <h3>Connect privately with Congolese community members.</h3>

          <p>
            A future space for direct messages, community support, mentorship,
            collaboration, and organizing projects.
          </p>
        </div>
      </section>

      <section className="messages-section">
        <h2>Messaging Features</h2>

        <div className="cards">
          <div className="card">
            <h3>Private Messages</h3>
            <p>Send direct messages to verified community members.</p>
          </div>

          <div className="card">
            <h3>Mentorship Chat</h3>
            <p>Connect students with professionals and community leaders.</p>
          </div>

          <div className="card">
            <h3>Project Collaboration</h3>
            <p>Organize fundraisers, events, and local initiatives.</p>
          </div>

          <div className="card">
            <h3>Community Support</h3>
            <p>Help new arrivals and families find trusted resources.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Messages;