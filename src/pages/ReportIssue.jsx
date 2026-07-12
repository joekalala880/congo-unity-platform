import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

function ReportIssue() {
  const [issue, setIssue] = useState({
    title: "",
    category: "",
    province: "",
    description: "",
  });

  const handleChange = (e) => {
    setIssue({
      ...issue,
      [e.target.name]: e.target.value,
    });
  };

  const submitIssue = async (e) => {
    e.preventDefault();

    try {
      const user = auth.currentUser;

      if (!user) {
        alert("Please login first");
        return;
      }

    await addDoc(collection(db, "issues"), {
  ...issue,
  userId: user.uid,
  email: user.email,
  status: "pending_review",
  supportVotes: 0,
  opposeVotes: 0,
  createdAt: new Date(),
});

      alert("Issue submitted successfully!");
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>Report an Issue</h1>
        <p>Submit community or national issues affecting Congolese people.</p>
      </div>

      <form className="register-form" onSubmit={submitIssue}>
        <input
          name="title"
          placeholder="Issue Title"
          onChange={handleChange}
        />

        <select name="category" onChange={handleChange}>
          <option value="">Select Category</option>
          <option value="Security">Security</option>
          <option value="Education">Education</option>
          <option value="Healthcare">Healthcare</option>
          <option value="Infrastructure">Infrastructure</option>
          <option value="Corruption">Corruption</option>
          <option value="Community">Community</option>
        </select>

        <input
          name="province"
          placeholder="Province"
          onChange={handleChange}
        />

        <textarea
          name="description"
          placeholder="Describe the issue..."
          onChange={handleChange}
        ></textarea>

        <button type="submit">Submit Issue</button>
      </form>
    </section>
  );
}

export default ReportIssue;