import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

function CreateAnnouncement() {
  const [announcement, setAnnouncement] = useState({
    title: "",
    category: "",
    message: "",
  });

  const handleChange = (e) => {
    setAnnouncement({
      ...announcement,
      [e.target.name]: e.target.value,
    });
  };

  const submitAnnouncement = async (e) => {
    e.preventDefault();

    try {
      const user = auth.currentUser;

      if (!user) {
        alert("Please login first");
        return;
      }

      await addDoc(collection(db, "announcements"), {
        ...announcement,
        createdBy: user.email,
        createdAt: new Date(),
        status: "published",
      });

      alert("Announcement created successfully!");

      setAnnouncement({
        title: "",
        category: "",
        message: "",
      });
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>Create Announcement</h1>
        <p>Post community updates, alerts, events, or official notices.</p>
      </div>

      <form className="register-form" onSubmit={submitAnnouncement}>
        <input
          name="title"
          value={announcement.title}
          placeholder="Announcement Title"
          onChange={handleChange}
        />

        <select
          name="category"
          value={announcement.category}
          onChange={handleChange}
        >
          <option value="">Select Category</option>
          <option value="Community">Community</option>
          <option value="Emergency Alert">Emergency Alert</option>
          <option value="Diaspora Event">Diaspora Event</option>
          <option value="Government Notice">Government Notice</option>
          <option value="Fundraiser">Fundraiser</option>
        </select>

        <textarea
          name="message"
          value={announcement.message}
          placeholder="Write announcement message..."
          onChange={handleChange}
        ></textarea>

        <button type="submit">Publish Announcement</button>
      </form>
    </section>
  );
}

export default CreateAnnouncement;