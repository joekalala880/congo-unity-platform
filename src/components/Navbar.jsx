import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar">
      <h2>🇨🇩 Congo Unity</h2>

      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/feed">Community</Link>
        <Link to="/east-crisis">Crisis</Link>
        <Link to="/diaspora">Diaspora</Link>
        <Link to="/directory">Directory</Link>
        <Link to="/government-dashboard">Government</Link>
        <Link to="/admin">Admin</Link>
        <Link to="/login">Login</Link>
      </div>
    </nav>
  );
}

export default Navbar;