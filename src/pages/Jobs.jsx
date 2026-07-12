import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Link } from "react-router-dom";

function Jobs() {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    const fetchJobs = async () => {
      const snapshot = await getDocs(collection(db, "jobs"));

      const data = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      }));

      setJobs(data);
    };

    fetchJobs();
  }, []);

  return (
    <div className="jobs-page">
      <section className="jobs-hero">
        <div className="jobs-overlay">
          <h1>Jobs Board</h1>
          <h3>Opportunities for Congolese people worldwide.</h3>

          <p>
            A space for jobs, internships, mentorship, and career opportunities
            for Congolese communities in Congo and the diaspora.
          </p>

          <Link to="/create-job">
            <button>Create Job</button>
          </Link>
        </div>
      </section>

      <section className="jobs-section">
        <h2>Latest Opportunities</h2>

        <div className="cards">
          {jobs.length === 0 ? (
            <div className="card">
              <h3>No jobs posted yet</h3>
              <p>Create the first job opportunity.</p>
            </div>
          ) : (
            jobs.map((job) => (
              <div className="card" key={job.id}>
             <Link to={`/jobs/${job.id}`}>
  <h3>{job.title}</h3>
</Link>
                <p><strong>Company:</strong> {job.company}</p>
                <p><strong>Location:</strong> {job.location}</p>
                <p><strong>Type:</strong> {job.type}</p>
                <p>{job.description}</p>

                {job.link && (
                  <a href={job.link} target="_blank" rel="noreferrer">
                    <button>Apply</button>
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default Jobs;