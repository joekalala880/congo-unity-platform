import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";

function VerifyCitizens() {
  const [citizens, setCitizens] = useState([]);

  const fetchCitizens = async () => {
    try {
      const snapshot = await getDocs(collection(db, "congoleseProfiles"));

      const data = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      }));

      setCitizens(data);
    } catch (error) {
      console.error("Error loading citizens:", error);
    }
  };

  useEffect(() => {
    (async () => {
      await fetchCitizens();
    })();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, "congoleseProfiles", id), {
        status: status,
      });

      alert(`Citizen marked as ${status}`);
      fetchCitizens();
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>Verify Citizens</h1>
        <p>Approve or reject registered Congolese profiles.</p>
      </div>

      <div className="cards">
        {citizens.map((citizen) => (
          <div className="card" key={citizen.id}>
            <h3>
              {citizen.firstName} {citizen.lastName}
            </h3>

            <p>
              <strong>Email:</strong> {citizen.email}
            </p>

            <p>
              <strong>Province:</strong> {citizen.province}
            </p>

            <p>
              <strong>Country:</strong> {citizen.currentCountry}
            </p>

            <p>
              <strong>Status:</strong> {citizen.status}
            </p>

            <button onClick={() => updateStatus(citizen.id, "verified")}>
              Approve Citizen
            </button>

            <button onClick={() => updateStatus(citizen.id, "rejected")}>
              Reject Citizen
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

export default VerifyCitizens;