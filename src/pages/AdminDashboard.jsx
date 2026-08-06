import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Link } from "react-router-dom";
import heroImage from "../galery photo/IMG_3465.JPG";

function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    jobs: 0,
    scholarships: 0,
    events: 0,
    posts: 0,
    issues: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const users = await getDocs(collection(db, "congoleseProfiles"));
      const jobs = await getDocs(collection(db, "jobs"));
      const scholarships = await getDocs(collection(db, "scholarships"));
      const events = await getDocs(collection(db, "events"));
      const posts = await getDocs(collection(db, "communityPosts"));
      const issues = await getDocs(collection(db, "issues"));

      setStats({
        users: users.size,
        jobs: jobs.size,
        scholarships: scholarships.size,
        events: events.size,
        posts: posts.size,
        issues: issues.size,
      });
    };

    fetchStats();
  }, []);

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2>🇨🇩 CONGO UNITY</h2>

        <Link to="/dashboard">Dashboard</Link>
        <Link to="/jobs">Jobs</Link>
        <Link to="/scholarships">Scholarships</Link>
        <Link to="/events">Events</Link>
        <Link to="/news">News</Link>
        <Link to="/businesses">Businesses</Link>
        <Link to="/feed">Community Feed</Link>
        <Link to="/direct-messages">Messages</Link>
        <Link to="/notifications">Notifications</Link>
        <Link to="/admin-cms">Create New</Link>
        <Link to="/settings">Settings</Link>

        <h2>Admin Tools</h2>
        <Link to="/admin/users">User Management</Link>
        <Link to="/admin/verifications">Verification Queue</Link>
        <Link to="/admin/service-applications">Service Applications</Link>
        <Link to="/admin/account-deletions">Account Deletions</Link>
        <Link to="/admin/gallery">Gallery Manager</Link>
        <Link to="/admin/jobs">Jobs Administration</Link>
      </aside>

      <main className="admin-main">
        <div className="admin-topbar">
          <h2>Admin Dashboard</h2>
          <input placeholder="Search anything..." />
        </div>

        <section
          className="admin-hero"
          style={{ backgroundImage: `linear-gradient(90deg, white 25%, rgba(255,255,255,0.75)), url(${heroImage})` }}
        >
          <div>
            <p className="gold-text">Welcome back, Joel 👋</p>
            <h1>Admin Dashboard</h1>
            <p>
              Manage Congo Unity Platform with live platform statistics and
              real-time insights.
            </p>

            <Link to="/">
              <button>View Platform</button>
            </Link>
          </div>
        </section>

        <h3>Overview Statistics</h3>

        <div className="admin-stats">
          <div className="admin-card">👥 <h3>Total Users</h3><h2>{stats.users}</h2></div>
          <div className="admin-card">💼 <h3>Jobs</h3><h2>{stats.jobs}</h2></div>
          <div className="admin-card">🎓 <h3>Scholarships</h3><h2>{stats.scholarships}</h2></div>
          <div className="admin-card">📅 <h3>Events</h3><h2>{stats.events}</h2></div>
          <div className="admin-card">💬 <h3>Community Posts</h3><h2>{stats.posts}</h2></div>
          <div className="admin-card">⚠️ <h3>Reported Issues</h3><h2>{stats.issues}</h2></div>
        </div>

        <div className="admin-bottom">
          <div className="admin-panel">
            <h3>Quick Actions</h3>
            <Link to="/create-job">Create New Job →</Link>
            <Link to="/create-scholarship">Create New Scholarship →</Link>
            <Link to="/create-event">Create New Event →</Link>
            <Link to="/create-news">Create News →</Link>
            <Link to="/create-business">Create Business →</Link>
          </div>

          <div className="admin-panel">
            <h3>Platform Health</h3>
            <p>Database ✅ Operational</p>
            <p>Authentication ✅ Operational</p>
            <p>Storage ✅ Operational</p>
            <p>Server Status ✅ Operational</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;