import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { Link } from "react-router-dom";

function SavedItems() {
  const [savedItems, setSavedItems] = useState([]);

  const fetchSavedItems = async () => {
    const user = auth.currentUser;

    if (!user) return;

    try {
      // Firestore rules only allow reading savedItems owned by the
      // signed-in user, so userEmail must be filtered server-side.
      const q = query(
        collection(db, "savedItems"),
        where("userEmail", "==", user.email)
      );

      const snapshot = await getDocs(q);

      const data = snapshot.docs
        .map((document) => ({
          id: document.id,
          ...document.data(),
        }))
        .filter((item) => item.removed !== true);

      setSavedItems(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    (async () => {
      await fetchSavedItems();
    })();
  }, []);

  const removeSavedItem = async (id) => {
    try {
      await updateDoc(doc(db, "savedItems", id), {
        removed: true,
      });

      fetchSavedItems();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>⭐ Saved Items</h1>
        <p>Your favorite jobs, news, businesses, events and scholarships.</p>
      </div>

      <div className="cards">
        {savedItems.length === 0 ? (
          <div className="card">
            <h3>No saved items</h3>
            <p>Save something to see it here.</p>
          </div>
        ) : (
          savedItems.map((item) => (
            <div className="card" key={item.id}>
              <h3>{item.title}</h3>

              <p>
                <strong>Type:</strong> {item.type}
              </p>

              <p>{item.description}</p>

              {item.link && (
                <Link to={item.link}>
                  <button>Open</button>
                </Link>
              )}

              <button
                onClick={() => removeSavedItem(item.id)}
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default SavedItems;