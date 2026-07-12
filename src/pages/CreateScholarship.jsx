import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

function CreateScholarship() {
  const [scholarship, setScholarship] = useState({
    title: "",
    organization: "",
    location: "",
    deadline: "",
    amount: "",
    description: "",
    link: "",
  });

  const handleChange = (e) => {
    setScholarship({
      ...scholarship,
      [e.target.name]: e.target.value,
    });
  };

  const submitScholarship = async (e) => {
    e.preventDefault();

    const user = auth.currentUser;

    if (!user) {
      alert("Please login first");
      return;
    }

    try {
      await addDoc(collection(db, "scholarships"), {
        ...scholarship,
        createdBy: user.email,
        createdAt: new Date(),
        status: "published",
      });

      alert("Scholarship posted successfully!");

      setScholarship({
        title: "",
        organization: "",
        location: "",
        deadline: "",
        amount: "",
        description: "",
        link: "",
      });
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>Create Scholarship</h1>
        <p>Add education opportunities for the Congolese community.</p>
      </div>

      <form className="register-form" onSubmit={submitScholarship}>
        <input
          name="title"
          value={scholarship.title}
          onChange={handleChange}
          placeholder="Scholarship Title"
        />

        <input
          name="organization"
          value={scholarship.organization}
          onChange={handleChange}
          placeholder="Organization"
        />

        <input
          name="location"
          value={scholarship.location}
          onChange={handleChange}
          placeholder="Location"
        />

        <input
          name="deadline"
          value={scholarship.deadline}
          onChange={handleChange}
          placeholder="Deadline"
        />

        <input
          name="amount"
          value={scholarship.amount}
          onChange={handleChange}
          placeholder="Amount"
        />

        <textarea
          name="description"
          value={scholarship.description}
          onChange={handleChange}
          placeholder="Scholarship Description"
        />

        <input
          name="link"
          value={scholarship.link}
          onChange={handleChange}
          placeholder="Application Link"
        />

        <button type="submit">Publish Scholarship</button>
      </form>
    </section>
  );
}

export default CreateScholarship;