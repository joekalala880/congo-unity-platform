import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

function ScholarshipDetails() {
  const { id } = useParams();
  const [scholarship, setScholarship] = useState(null);

  useEffect(() => {
    const fetchScholarship = async () => {
      try {
        const ref = doc(db, "scholarships", id);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setScholarship({
            id: snap.id,
            ...snap.data(),
          });
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchScholarship();
  }, [id]);

  if (!scholarship) {
    return (
      <div className="register-section">
        <h2>Loading Scholarship...</h2>
      </div>
    );
  }

  return (
    <div className="register-section">
      <div className="card">
        <h1>{scholarship.title}</h1>

        <p>
          <strong>Organization:</strong> {scholarship.organization}
        </p>

        <p>
          <strong>Location:</strong> {scholarship.location}
        </p>

        <p>
          <strong>Deadline:</strong> {scholarship.deadline}
        </p>

        <p>
          <strong>Amount:</strong> {scholarship.amount}
        </p>

        <h3>Description</h3>

        <p>{scholarship.description}</p>

        {scholarship.link && (
          <a
            href={scholarship.link}
            target="_blank"
            rel="noreferrer"
          >
            <button>Apply Now</button>
          </a>
        )}

        <br />
        <br />

        <Link to="/scholarships">
          <button>Back to Scholarships</button>
        </Link>
      </div>
    </div>
  );
}

export default ScholarshipDetails;