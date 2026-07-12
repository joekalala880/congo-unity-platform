import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

function CreateJob() {
  const [job, setJob] = useState({
    title: "",
    company: "",
    location: "",
    type: "",
    description: "",
    link: "",
  });

  const handleChange = (e) => {
    setJob({
      ...job,
      [e.target.name]: e.target.value,
    });
  };

  const submitJob = async (e) => {
    e.preventDefault();

    const user = auth.currentUser;

    if (!user) {
      alert("Please login first");
      return;
    }

    try {
      await addDoc(collection(db, "jobs"), {
        ...job,
        createdBy: user.email,
        createdAt: new Date(),
        status: "published",
      });

      alert("Job posted successfully!");

      setJob({
        title: "",
        company: "",
        location: "",
        type: "",
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
        <h1>Create Job</h1>
        <p>Add job opportunities for the Congolese community.</p>
      </div>

      <form className="register-form" onSubmit={submitJob}>
        <input name="title" value={job.title} onChange={handleChange} placeholder="Job Title" />
        <input name="company" value={job.company} onChange={handleChange} placeholder="Company" />
        <input name="location" value={job.location} onChange={handleChange} placeholder="Location" />
        <input name="type" value={job.type} onChange={handleChange} placeholder="Full-time, Part-time, Internship..." />

        <textarea
          name="description"
          value={job.description}
          onChange={handleChange}
          placeholder="Job Description"
        />

        <input name="link" value={job.link} onChange={handleChange} placeholder="Application Link" />

        <button type="submit">Publish Job</button>
      </form>
    </section>
  );
}

export default CreateJob;