import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, onSnapshot, orderBy, query, updateDoc, where, writeBatch } from "firebase/firestore";
import { auth, db } from "../firebase";

// Shared real-time notifications feed used by both the Navbar badge and the
// Notifications page, so there's only one listener implementation to keep
// in sync with firestore.rules (notifications are queried by `to` == the
// signed-in user's email, matching the rule's ownership check).
function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      unsubscribeSnapshot();

      if (!user) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      const q = query(
        collection(db, "notifications"),
        where("to", "==", user.email),
        orderBy("createdAt", "desc")
      );

      unsubscribeSnapshot = onSnapshot(
        q,
        (snapshot) => {
          setNotifications(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
          setLoading(false);
        },
        (error) => {
          console.error("Failed to load notifications:", error);
          setLoading(false);
        }
      );
    });

    return () => {
      unsubscribeAuth();
      unsubscribeSnapshot();
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async (notificationId) => {
    await updateDoc(doc(db, "notifications", notificationId), { read: true });
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;

    const batch = writeBatch(db);
    unread.forEach((n) => batch.update(doc(db, "notifications", n.id), { read: true }));
    await batch.commit();
  };

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead };
}

export default useNotifications;
