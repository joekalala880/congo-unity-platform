import { Link } from "react-router-dom";
import useNotifications from "../hooks/useNotifications";
import "./Notifications.css";

function formatDateTime(value) {
  if (!value) return "";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function Notifications() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>Notifications</h1>
        <p>See your latest Congo Unity activity.</p>
      </div>

      {!loading && unreadCount > 0 && (
        <div className="notif-actions">
          <button type="button" onClick={markAllAsRead}>Mark All as Read ({unreadCount})</button>
        </div>
      )}

      <div className="cards">
        {loading ? (
          <p>Loading…</p>
        ) : notifications.length === 0 ? (
          <div className="card">
            <h3>No notifications yet</h3>
            <p>
              When someone messages you, follows you, or your government service / identity
              verification status changes, it will show here.
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div className={`card ${!notification.read ? "notification-unread" : ""}`} key={notification.id}>
              <h3>{notification.type}</h3>

              <p>{notification.message}</p>

              <p>
                <strong>From:</strong> {notification.from || "Congo Unity"}
              </p>

              <p className="notif-time">{formatDateTime(notification.createdAt)}</p>

              {notification.relatedRoute && (
                <Link to={notification.relatedRoute} onClick={() => !notification.read && markAsRead(notification.id)}>
                  View details
                </Link>
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
