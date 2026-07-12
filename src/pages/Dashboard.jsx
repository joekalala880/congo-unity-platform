import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Link } from "react-router-dom";

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
      const usersSnapshot = await getDocs(collection(db, "congoleseProfiles"));
      const jobsSnapshot = await getDocs(collection(db, "jobs"));
      const scholarshipsSnapshot = await getDocs(collection(db, "scholarships"));
      const eventsSnapshot = await getDocs(collection(db, "events"));
      const postsSnapshot = await getDocs(collection(db, "communityPosts"));
      const issuesSnapshot = await getDocs(collection(db, "issues"));

      setStats({
        users: usersSnapshot.size,
        jobs: jobsSnapshot.size,
        scholarships: scholarshipsSnapshot.size,
        events: eventsSnapshot.size,
        posts: postsSnapshot.size,
        issues: issuesSnapshot.size,
      });
    };

    fetchStats();
  }, []);

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>Admin Dashboard</h1>
        <p>Manage Congo Unity Platform with live platform statistics.</p>
      </div>

      <div className="cards">
        <div className="card">
          <h3>Total Users</h3>
          <p>{stats.users}</p>
        </div>

        <div className="card">
          <h3>Jobs</h3>
          <p>{stats.jobs}</p>
        </div>

        <div className="card">
          <h3>Scholarships</h3>
          <p>{stats.scholarships}</p>
        </div>

        <div className="card">
          <h3>Events</h3>
          <p>{stats.events}</p>
        </div>

        <div className="card">
          <h3>Community Posts</h3>
          <p>{stats.posts}</p>
        </div>

        <div className="card">
          <h3>Reported Issues</h3>
          <p>{stats.issues}</p>
        </div>
      </div>

      <div className="cards">
        <div className="card">
          <h3>Create Content</h3>

          <Link to="/create-job">
            <button>Create Job</button>
          </Link>

          <Link to="/create-scholarship">
            <button>Create Scholarship</button>
          </Link>

          <Link to="/create-event">
            <button>Create Event</button>
          </Link>

          <Link to="/create-announcement">
            <button>Create Announcement</button>
          </Link>
        </div>

        <div className="card">
          <h3>Management</h3>

          <Link to="/user-management">
            <button>User Management</button>
          </Link>

          <Link to="/verify-citizens">
            <button>Verify Citizens</button>
          </Link>

          <Link to="/admin-cms">
            <button>Admin CMS</button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default AdminDashboard;