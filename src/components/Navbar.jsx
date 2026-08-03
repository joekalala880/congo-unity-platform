import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";
import useIsAdmin from "../hooks/useIsAdmin";

function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const { isAdmin } = useIsAdmin();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = async () => {
    await signOut(auth);
    closeMenu();
    navigate("/login");
  };

  return (
    <nav className="navbar">
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
        <Link to="/feed" onClick={closeMenu}>Community</Link>
        <Link to="/directory" onClick={closeMenu}>Directory</Link>
        <Link to="/jobs" onClick={closeMenu}>Jobs</Link>
        <Link to="/diaspora" onClick={closeMenu}>Diaspora</Link>
        <Link to="/congo-gallery" onClick={closeMenu}>Gallery</Link>
        <Link to="/east-crisis" onClick={closeMenu}>Crisis</Link>
        <Link to="/government-dashboard" onClick={closeMenu}>Government</Link>

        {isAdmin && (
          <Link to="/admin" onClick={closeMenu}>Admin</Link>
        )}

        {user ? (
          <>
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
