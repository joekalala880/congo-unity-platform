function Register() {
  return (
    <section className="register-section">
      <div className="register-header">
        <h1>Register Congolese Profile</h1>
        <p>Create your profile to join Congo Unity Platform.</p>
      </div>

      <form className="register-form">
        <input type="text" placeholder="First Name" />
        <input type="text" placeholder="Middle Name" />
        <input type="text" placeholder="Last Name" />

        <input type="date" />

        <input type="text" placeholder="Province" />
        <input type="text" placeholder="Territory" />
        <input type="text" placeholder="Village / City" />

        <input type="text" placeholder="Current Country" />
        <input type="tel" placeholder="Phone Number" />
        <input type="email" placeholder="Email Address" />
        <input type="password" placeholder="Password" />

        <button type="submit">Register Profile</button>
      </form>
    </section>
  );
}

export default Register;
