import "./App.css";
import Register from "./pages/Register";

function App() {
  return (
    <div className="app">
      <nav className="navbar">
        <h2>Congo Unity Platform</h2>

        <div className="nav-links">
          <a href="#mission">Mission</a>
          <a href="#features">Features</a>
          <a href="#join">Join</a>
        </div>
      </nav>

      <section className="hero-section">
        <div className="hero-content">
          <h1>Putting All Congolese Together</h1>

          <p>
            A digital platform to connect Congolese people around the world,
            strengthen identity, report community issues, and build a stronger
            future for Congo.
          </p>

          <button>Join the Community</button>
        </div>
      </section>

      <section id="mission" className="section">
        <h2>Our Mission</h2>
        <Register />

        <p>
          We want to unite Congolese people across all provinces and the
          diaspora through technology, community engagement, and data-driven
          solutions.
        </p>
      </section>

      <section id="features" className="cards">
        <div className="card">
          <h3>Identity Directory</h3>
          <p>
            Register and connect Congolese people from all provinces and around
            the world.
          </p>
        </div>

        <div className="card">
          <h3>Issue Reporting</h3>
          <p>
            Report community and national issues to help leaders understand
            challenges.
          </p>
        </div>

        <div className="card">
          <h3>Government Dashboard</h3>
          <p>
            Visualize statistics and reports to support better decision making.
          </p>
        </div>
      </section>

      <section id="join" className="section">
        <h2>Built for Congo</h2>

        <p>
          This platform is designed to help connect, organize, and empower
          Congolese communities worldwide.
        </p>
      </section>
    </div>
  );
}

export default App;
