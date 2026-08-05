import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { Link } from "react-router-dom";
import { auth } from "../firebase";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setStatus("sending");

    try {
      await sendPasswordResetEmail(auth, email);
      setStatus("sent");
    } catch (err) {
      console.error("Password reset error:", err);
      // Same confirmation regardless of whether the email exists, so this
      // page can't be used to probe which addresses are registered.
      setStatus("sent");
    }
  };

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>Forgot Password</h1>
        <p>We'll email you a link to reset your password.</p>
      </div>

      {status === "sent" ? (
        <p className="register-form__success" role="status">
          If an account exists for {email}, a password reset link is on its way. Check your inbox
          (and spam folder).
        </p>
      ) : (
        <form className="register-form" onSubmit={handleSubmit}>
          {error && <p className="register-form__error" role="alert">{error}</p>}

          <input
            name="email"
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button type="submit" disabled={status === "sending"}>
            {status === "sending" ? "Sending…" : "Send Reset Link"}
          </button>
        </form>
      )}

      <p>
        <Link to="/login">Back to Login</Link>
      </p>
    </section>
  );
}

export default ForgotPassword;
