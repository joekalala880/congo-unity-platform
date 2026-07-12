import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Link } from "react-router-dom";

function Scholarships() {
  const [scholarships, setScholarships] = useState([]);

  useEffect(() => {
    const fetchScholarships = async () => {
      const snapshot = await getDocs(collection(db, "scholarships"));

      const data = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      }));

      setScholarships(data);
    };

    fetchScholarships();
  }, []);

  return (
    <div className="scholarships-page">
      <section className="scholarships-hero">
        <div className="scholarships-overlay">
          <h1>Scholarships</h1>
          <h3>Education can change the future of Congo.</h3>

          <p>
            Find scholarships, grants, fellowships, and training programs for
            Congolese students worldwide.
          </p>

          <Link to="/create-scholarship">
            <button>Create Scholarship</button>
          </Link>
        </div>
      </section>

      <section className="scholarships-section">
        <h2>Latest Scholarships</h2>

        <div className="cards">
          {scholarships.length === 0 ? (
            <div className="card">
              <h3>No scholarships posted yet</h3>
              <p>Create the first education opportunity.</p>
            </div>
          ) : (
            scholarships.map((item) => (
              <div className="card" key={item.id}>
               <Link to={`/scholarships/${item.id}`}>
  <h3>{item.title}</h3>
</Link>

                <p>
                  <strong>Organization:</strong> {item.organization}
                </p>

                <p>
                  <strong>Location:</strong> {item.location}
                </p>

                <p>
                  <strong>Deadline:</strong> {item.deadline}
                </p>

                <p>
                  <strong>Amount:</strong> {item.amount}
                </p>

                <p>{item.description}</p>

                {item.link && (
                  <a href={item.link} target="_blank" rel="noreferrer">
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

export default Scholarships;