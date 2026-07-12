function Settings() {
  return (
    <div className="settings-page">
      <section className="settings-hero">
        <div className="settings-overlay">
          <h1>Settings</h1>
          <h3>Control your Congo Unity experience.</h3>

          <p>
            Manage your language, notifications, privacy, region, and personal
            preferences.
          </p>
        </div>
      </section>

      <section className="settings-section">
        <h2>User Preferences</h2>

        <div className="cards">
          <div className="card">
            <h3>Language</h3>
            <p>Choose English, French, Lingala, Swahili, Kikongo, or Tshiluba.</p>
          </div>

          <div className="card">
            <h3>Notifications</h3>
            <p>Control alerts for news, comments, verification, and emergencies.</p>
          </div>

          <div className="card">
            <h3>Privacy</h3>
            <p>Choose what information is visible in the community directory.</p>
          </div>

          <div className="card">
            <h3>Region</h3>
            <p>Set your province, city, or diaspora country for personalized updates.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Settings;