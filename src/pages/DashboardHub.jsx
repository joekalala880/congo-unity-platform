import { Link } from "react-router-dom";

function DashboardHub() {
  return (
    <div className="hub-page">
      <section className="hub-hero">
        <div className="hub-overlay">
          <h1>Congo Unity Hub</h1>
          <h3>Your control center for the movement.</h3>

          <p>
            Access community tools, crisis reporting, diaspora resources,
            admin pages, and national dashboards in one place.
          </p>
        </div>
      </section>

      <section className="hub-section">
        <h2>Community</h2>
        <div className="hub-grid">
          <Link to="/feed" className="hub-card">Community Feed</Link>
          <Link to="/directory" className="hub-card">Citizen Directory</Link>
          <Link to="/profile" className="hub-card">My Profile</Link>
          <Link to="/messages" className="hub-card">Messages</Link>
        </div>

        <h2>Crisis & Action</h2>
        <div className="hub-grid">
          <Link to="/east-crisis" className="hub-card">East Crisis</Link>
          <Link to="/crisis-alerts" className="hub-card">Crisis Alerts</Link>
          <Link to="/report-issue" className="hub-card">Report Issue</Link>
          <Link to="/take-action" className="hub-card">Take Action</Link>
        </div>

        <h2>Diaspora & Resources</h2>
        <div className="hub-grid">
          <Link to="/diaspora" className="hub-card">Diaspora Hub</Link>
          <Link to="/diaspora-directory" className="hub-card">Diaspora Directory</Link>
          <Link to="/fundraisers" className="hub-card">Fundraisers</Link>
          <Link to="/events" className="hub-card">Events</Link>
          <Link to="/businesses" className="hub-card">Businesses</Link>
          <Link to="/jobs" className="hub-card">Jobs</Link>
          <Link to="/scholarships" className="hub-card">Scholarships</Link>
          <Link to="/volunteer" className="hub-card">Volunteer</Link>
        </div>

        <h2>Information & Trust</h2>
        <div className="hub-grid">
          <Link to="/news" className="hub-card">News</Link>
          <Link to="/culture" className="hub-card">Culture</Link>
          <Link to="/osint" className="hub-card">OSINT Center</Link>
          <Link to="/announcements" className="hub-card">Announcements</Link>
          <Link to="/aid-directory" className="hub-card">Aid Directory</Link>
          <Link to="/partners" className="hub-card">Partners</Link>
        </div>

        <h2>Admin & Government</h2>
        <div className="hub-grid">
          <Link to="/admin" className="hub-card">Admin Dashboard</Link>
          <Link to="/user-management" className="hub-card">User Management</Link>
          <Link to="/verify-citizens" className="hub-card">Verify Citizens</Link>
          <Link to="/government-dashboard" className="hub-card">Government Dashboard</Link>
          <Link to="/congo-map" className="hub-card">Congo Map</Link>
        </div>
      </section>
    </div>
  );
}

export default DashboardHub;