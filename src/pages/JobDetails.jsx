import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

function JobDetails() {
  const { id } = useParams();
  const [job, setJob] = useState(null);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const ref = doc(db, "jobs", id);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setJob({
            id: snap.id,
            ...snap.data(),
          });
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchJob();
  }, [id]);

  if (!job) {
    return (
      <div className="register-section">
        <h2>Loading Job...</h2>
      </div>
    );
  }

  return (
    <div className="register-section">
      <div className="card">
        <h1>{job.title}</h1>

        <p><strong>Company:</strong> {job.company}</p>

        <p><strong>Location:</strong> {job.location}</p>

        <p><strong>Type:</strong> {job.type}</p>

        <p>{job.description}</p>

        {job.link && (
          <a href={job.link} target="_blank" rel="noreferrer">
            <button>Apply Now</button>
          </a>
        )}

        <br />
        <br />

        <Link to="/jobs">
          <button>Back to Jobs</button>
        </Link>
      </div>
    </div>
  );
}

export default JobDetails;