import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";

function Notifications() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const user = auth.currentUser;

    if (!user) return;

    // Firestore rules only allow reading notifications addressed to the
    // signed-in user, so the query must filter server-side rather than
    // fetching everything and filtering in the client.
    const q = query(
      collection(db, "notifications"),
      where("to", "==", user.email),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      }));

      setNotifications(data);
    });

    return () => unsubscribe();
  }, []);

  const markAsRead = async (notificationId) => {
    await updateDoc(doc(db, "notifications", notificationId), {
      read: true,
    });
  };

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>Notifications</h1>
        <p>See your latest Congo Unity activity.</p>
      </div>

      <div className="cards">
        {notifications.length === 0 ? (
          <div className="card">
            <h3>No notifications yet</h3>
            <p>
              When someone follows you, messages you, or comments, it will show
              here.
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div className="card" key={notification.id}>
              <h3>{notification.type}</h3>

              <p>{notification.message}</p>

              <p>
                <strong>From:</strong> {notification.from}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                {notification.read ? "Read" : "Unread"}
              </p>

              {notification.relatedRoute && (
                <Link to={notification.relatedRoute}>View details</Link>
              )}

              {!notification.read && (
                <button onClick={() => markAsRead(notification.id)}>
                  Mark as Read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default Notifications;