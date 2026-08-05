import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";
import useIsAdmin from "../hooks/useIsAdmin";
import useNotifications from "../hooks/useNotifications";

function NavGroup({ label, id, openGroup, setOpenGroup, children }) {
  const isOpen = openGroup === id;

  return (
    <div className="navbar-group">
      <button
        type="button"
        className="navbar-group-toggle"
        aria-expanded={isOpen}
        aria-haspopup="true"
        onClick={() => setOpenGroup(isOpen ? null : id)}
      >
        {label} <span className="navbar-group-caret">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className="navbar-group-menu" role="menu">
          {children}
        </div>
      )}
    </div>
  );
}

function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const { isAdmin } = useIsAdmin();
  const { unreadCount } = useNotifications();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState(null);
  const navRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setOpenGroup(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const closeMenu = () => {
    setMenuOpen(false);
    setOpenGroup(null);
  };

  const handleLogout = async () => {
    await signOut(auth);
    closeMenu();
    navigate("/login");
  };

  return (
    <nav className="navbar" ref={navRef}>
      <h2>🇨🇩 Congo Unity</h2>

      <button
        className="navbar-toggle"
        onClick={() => setMenuOpen((open) => !open)}
        aria-label="Toggle navigation menu"
        aria-expanded={menuOpen}
      >
        ☰
      </button>

      <div className={`nav-links${menuOpen ? " open" : ""}`}>
        <Link to="/" onClick={closeMenu}>Home</Link>

        <NavGroup label="Community" id="community" openGroup={openGroup} setOpenGroup={setOpenGroup}>
          <Link to="/feed" onClick={closeMenu}>Community Feed</Link>
          <Link to="/directory" onClick={closeMenu}>Directory</Link>
          <Link to="/jobs" onClick={closeMenu}>Jobs</Link>
          <Link to="/diaspora" onClick={closeMenu}>Diaspora</Link>
          <Link to="/congo-gallery" onClick={closeMenu}>Gallery</Link>
          <Link to="/east-crisis" onClick={closeMenu}>Crisis</Link>
        </NavGroup>

        <NavGroup label="Government Services" id="government" openGroup={openGroup} setOpenGroup={setOpenGroup}>
          <Link to="/government/services" onClick={closeMenu}>Request a Service</Link>
          {user && <Link to="/government/applications" onClick={closeMenu}>My Applications</Link>}
          <Link to="/government-dashboard" onClick={closeMenu}>National Statistics</Link>
        </NavGroup>

        {user && (
          <NavGroup label="Digital Identity" id="identity" openGroup={openGroup} setOpenGroup={setOpenGroup}>
            <Link to="/identity" onClick={closeMenu}>Identity Dashboard</Link>
            <Link to="/profile" onClick={closeMenu}>My Profile</Link>
            <Link to="/identity/documents" onClick={closeMenu}>Identity Documents</Link>
          </NavGroup>
        )}

        {isAdmin && (
          <Link to="/admin" onClick={closeMenu}>Admin</Link>
        )}

        {user ? (
          <>
            <Link to="/notifications" onClick={closeMenu} className="navbar-notifications">
              Notifications
              {unreadCount > 0 && <span className="navbar-notif-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>}
            </Link>
            <Link to="/dashboard" onClick={closeMenu}>Dashboard</Link>
            <button className="navbar-logout" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" onClick={closeMenu}>Login</Link>
            <Link to="/register" onClick={closeMenu}>Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
