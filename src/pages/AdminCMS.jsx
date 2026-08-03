import { Link } from "react-router-dom";

function AdminCMS() {
  return (
    <section className="register-section">
      <div className="register-header">
        <h1>🇨🇩 Congo Unity Platform Admin CMS</h1>
        <p>
          Create, publish, and manage all content across the Congo Unity
          Platform.
        </p>
      </div>

      <div className="cards">

        <div className="card">
          <h3>🖼️ Gallery</h3>
          <p>Add, edit, and manage Congo Memory & Influence Gallery content.</p>

          <Link to="/admin/gallery">
            <button>Manage Gallery</button>
          </Link>
        </div>

        <div className="card">
          <h3>💼 Jobs</h3>
          <p>Create employment opportunities for Congolese people worldwide.</p>

          <Link to="/create-job">
            <button>Create Job</button>
          </Link>
        </div>

        <div className="card">
          <h3>🎓 Scholarships</h3>
          <p>Add scholarships, grants, fellowships, and education programs.</p>

          <Link to="/create-scholarship">
            <button>Create Scholarship</button>
          </Link>
        </div>

        <div className="card">
          <h3>📅 Events</h3>
          <p>Publish conferences, meetings, fundraisers, and community events.</p>

          <Link to="/create-event">
            <button>Create Event</button>
          </Link>
        </div>

        <div className="card">
          <h3>📰 News</h3>
          <p>Publish verified news, updates, and important announcements.</p>

          <Link to="/create-news">
            <button>Create News</button>
          </Link>
        </div>

        <div className="card">
          <h3>📢 Announcements</h3>
          <p>Share official community announcements and important alerts.</p>

          <Link to="/create-announcement">
            <button>Create Announcement</button>
          </Link>
        </div>

        <div className="card">
          <h3>❤️ Fundraisers</h3>
          <p>Create fundraising campaigns for verified community projects.</p>

          <Link to="/create-fundraiser">
            <button>Create Fundraiser</button>
          </Link>
        </div>

        <div className="card">
          <h3>🏢 Businesses</h3>
          <p>Add Congolese-owned businesses and organizations.</p>

          <Link to="/create-business">
            <button>Create Business</button>
          </Link>
        </div>

        <div className="card">
          <h3>🤝 Partners</h3>
          <p>Add NGOs, churches, universities, and community partners.</p>

          <Link to="/partners">
            <button>Manage Partners</button>
          </Link>
        </div>

        <div className="card">
          <h3>👥 User Management</h3>
          <p>Manage registered members and verify citizen accounts.</p>

          <Link to="/user-management">
            <button>Manage Users</button>
          </Link>
        </div>

        <div className="card">
          <h3>✅ Verify Citizens</h3>
          <p>Review submitted documents and verify Congolese citizens.</p>

          <Link to="/verify-citizens">
            <button>Verify Citizens</button>
          </Link>
        </div>

      </div>
    </section>
  );
}

export default AdminCMS;