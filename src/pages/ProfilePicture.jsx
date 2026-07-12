function ProfilePicture() {
  return (
    <div className="register-section">
      <h1>Profile Picture</h1>

      <img
        src="https://via.placeholder.com/150"
        alt="Profile"
        style={{
          width: "150px",
          height: "150px",
          borderRadius: "50%",
        }}
      />

      <p>Profile picture upload coming soon.</p>
    </div>
  );
}

export default ProfilePicture;