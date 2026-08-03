import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import Avatar from "../components/Avatar";
import { fetchGalleryPage } from "../services/galleryService";
import { resolveGalleryImage } from "./galleryLocalImages";
import "./Dashboard.css";

const PROFILE_FIELDS = [
  "firstName",
  "lastName",
  "phone",
  "province",
  "territory",
  "village",
  "currentCountry",
  "dateOfBirth",
  "profileImageUrl",
];

function computeProfileCompletion(profile) {
  if (!profile) return { percent: 0, filled: 0, total: PROFILE_FIELDS.length };

  const filled = PROFILE_FIELDS.filter((field) => {
    const value = profile[field];
    return typeof value === "string" ? value.trim().length > 0 : Boolean(value);
  }).length;

  return {
    percent: Math.round((filled / PROFILE_FIELDS.length) * 100),
    filled,
    total: PROFILE_FIELDS.length,
  };
}

function statusBadge(status) {
  if (status === "verified") return { label: "Verified", className: "db-badge-verified" };
  if (status === "rejected") return { label: "Rejected", className: "db-badge-rejected" };
  return { label: "Pending Verification", className: "db-badge-pending" };
}

function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function timeAgo(value) {
  const date = toDate(value);
  if (!date) return "";

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function StatSkeleton() {
  return (
    <div className="db-skeleton db-skeleton-stat" role="status" aria-label="Loading" />
  );
}

function ListSkeleton() {
  return (
    <div className="db-list-card">
      <div className="db-skeleton db-skeleton-line" style={{ width: "40%" }} />
      <div className="db-skeleton db-skeleton-line" />
      <div className="db-skeleton db-skeleton-line" />
      <div className="db-skeleton db-skeleton-line" />
    </div>
  );
}

function Dashboard() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [followingCount, setFollowingCount] = useState(0);
  const [followingLoading, setFollowingLoading] = useState(true);

  const [messagesCount, setMessagesCount] = useState(0);
  const [messagesLoading, setMessagesLoading] = useState(true);

  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(true);

  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);

  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  const [galleryItems, setGalleryItems] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(true);

  const [recentPosts, setRecentPosts] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecked(true);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    (async () => {
      setProfileLoading(true);
      try {
        const snapshot = await getDocs(
          query(collection(db, "congoleseProfiles"), where("userId", "==", user.uid))
        );
        setProfile(snapshot.docs[0]?.data() || null);
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setProfileLoading(false);
      }
    })();

    (async () => {
      setFollowingLoading(true);
      try {
        const snapshot = await getDocs(
          query(
            collection(db, "congoleseProfiles"),
            where("followers", "array-contains", user.email)
          )
        );
        setFollowingCount(snapshot.size);
      } catch (error) {
        console.error("Failed to load following count:", error);
      } finally {
        setFollowingLoading(false);
      }
    })();

    (async () => {
      setMessagesLoading(true);
      try {
        const [sentSnap, receivedSnap] = await Promise.all([
          getDocs(query(collection(db, "messages"), where("from", "==", user.email))),
          getDocs(query(collection(db, "messages"), where("to", "==", user.email))),
        ]);
        setMessagesCount(sentSnap.size + receivedSnap.size);
      } catch (error) {
        console.error("Failed to load messages count:", error);
      } finally {
        setMessagesLoading(false);
      }
    })();

    (async () => {
      setNotificationsLoading(true);
      try {
        const snapshot = await getDocs(
          query(collection(db, "notifications"), where("to", "==", user.email))
        );
        const unread = snapshot.docs.filter((d) => !d.data().read).length;
        setUnreadNotifications(unread);
      } catch (error) {
        console.error("Failed to load notifications:", error);
      } finally {
        setNotificationsLoading(false);
      }
    })();

    (async () => {
      setNewsLoading(true);
      try {
        const snapshot = await getDocs(
          query(collection(db, "news"), orderBy("createdAt", "desc"), limit(3))
        );
        setNews(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error("Failed to load news:", error);
      } finally {
        setNewsLoading(false);
      }
    })();

    (async () => {
      setEventsLoading(true);
      try {
        const snapshot = await getDocs(
          query(collection(db, "events"), orderBy("createdAt", "desc"), limit(4))
        );
        setEvents(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error("Failed to load events:", error);
      } finally {
        setEventsLoading(false);
      }
    })();

    (async () => {
      setGalleryLoading(true);
      try {
        const { items } = await fetchGalleryPage({ category: "All" });
        setGalleryItems(items.slice(0, 4));
      } catch (error) {
        console.error("Failed to load gallery items:", error);
      } finally {
        setGalleryLoading(false);
      }
    })();

    (async () => {
      setActivityLoading(true);
      try {
        const snapshot = await getDocs(
          query(collection(db, "communityPosts"), orderBy("createdAt", "desc"), limit(5))
        );
        setRecentPosts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error("Failed to load recent activity:", error);
      } finally {
        setActivityLoading(false);
      }
    })();
  }, [user]);

  if (authChecked && !user) {
    return (
      <div className="db-page">
        <div className="db-signed-out">
          <h1>Dashboard</h1>
          <p>
            Please <Link to="/login">log in</Link> to view your Congo Unity dashboard.
          </p>
        </div>
      </div>
    );
  }

  const completion = computeProfileCompletion(profile);
  const badge = statusBadge(profile?.status);
  const followersCount = profile?.followers?.length || 0;

  return (
    <div className="db-page">
      <div className="db-welcome">
        <Avatar
          src={profile?.profileImageUrl}
          className="db-welcome-avatar"
          alt={profile?.firstName || "Your profile photo"}
        />
        <div>
          <h1>
            {profile?.firstName ? `Welcome back, ${profile.firstName}` : "Welcome back"}
          </h1>
          <p>Here's what's happening on Congo Unity.</p>
        </div>
      </div>

      <section className="db-section">
        <div className="db-section-head">
          <h2>Your Overview</h2>
        </div>

        <div className="db-stat-grid">
          {profileLoading ? (
            <StatSkeleton />
          ) : (
            <div className="db-stat-card">
              <p className="db-stat-label">Profile Completion</p>
              <p className="db-stat-value">{completion.percent}%</p>
              <div className="db-progress-track">
                <div className="db-progress-fill" style={{ width: `${completion.percent}%` }} />
              </div>
              <p className="db-stat-sub">
                {completion.filled} of {completion.total} fields complete
              </p>
            </div>
          )}

          {profileLoading ? (
            <StatSkeleton />
          ) : (
            <div className="db-stat-card">
              <p className="db-stat-label">Verification Status</p>
              <span className={`db-badge ${badge.className}`}>{badge.label}</span>
            </div>
          )}

          {messagesLoading ? (
            <StatSkeleton />
          ) : (
            <Link to="/direct-messages" className="db-stat-card">
              <p className="db-stat-label">Messages</p>
              <p className="db-stat-value">{messagesCount}</p>
              <p className="db-stat-sub">View conversations</p>
            </Link>
          )}

          {notificationsLoading ? (
            <StatSkeleton />
          ) : (
            <Link to="/notifications" className="db-stat-card">
              <p className="db-stat-label">Notifications</p>
              <p className="db-stat-value">{unreadNotifications}</p>
              <p className="db-stat-sub">Unread</p>
            </Link>
          )}

          {profileLoading ? (
            <StatSkeleton />
          ) : (
            <Link to="/followers" className="db-stat-card">
              <p className="db-stat-label">Followers</p>
              <p className="db-stat-value">{followersCount}</p>
              <p className="db-stat-sub">View followers</p>
            </Link>
          )}

          {followingLoading ? (
            <StatSkeleton />
          ) : (
            <Link to="/following" className="db-stat-card">
              <p className="db-stat-label">Following</p>
              <p className="db-stat-value">{followingCount}</p>
              <p className="db-stat-sub">View following</p>
            </Link>
          )}
        </div>
      </section>

      <section className="db-section">
        <div className="db-section-head">
          <h2>Quick Actions</h2>
        </div>

        <div className="db-actions-grid">
          <Link to="/edit-profile" className="db-action-button">Edit Profile</Link>
          <Link to="/uploadid" className="db-action-button">Upload ID</Link>
          <Link to="/search-users" className="db-action-button">Find People</Link>
          <Link to="/feed" className="db-action-button">Community Feed</Link>
          <Link to="/direct-messages" className="db-action-button">Messages</Link>
          <Link to="/congo-gallery" className="db-action-button">Explore Gallery</Link>
        </div>
      </section>

      <section className="db-section">
        <div className="db-content-grid">
          {newsLoading ? (
            <ListSkeleton />
          ) : (
            <div className="db-list-card">
              <div className="db-section-head">
                <h3>Latest Congo News</h3>
                <Link to="/news" className="db-section-link">View all</Link>
              </div>

              {news.length === 0 ? (
                <p className="db-empty">No news published yet.</p>
              ) : (
                news.map((item) => (
                  <Link to={`/news/${item.id}`} className="db-list-item" key={item.id}>
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt="" className="db-list-thumb" />
                    )}
                    <div className="db-list-item-body">
                      <h4>{item.title}</h4>
                      <p>{timeAgo(item.createdAt)}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}

          {eventsLoading ? (
            <ListSkeleton />
          ) : (
            <div className="db-list-card">
              <div className="db-section-head">
                <h3>Upcoming Events</h3>
                <Link to="/events" className="db-section-link">View all</Link>
              </div>

              {events.length === 0 ? (
                <p className="db-empty">No events posted yet.</p>
              ) : (
                events.map((item) => (
                  <div className="db-list-item" key={item.id}>
                    <div className="db-list-item-body">
                      <h4>{item.title}</h4>
                      <p>{item.date || timeAgo(item.createdAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {galleryLoading ? (
            <ListSkeleton />
          ) : (
            <div className="db-list-card">
              <div className="db-section-head">
                <h3>Recent Gallery Additions</h3>
                <Link to="/congo-gallery" className="db-section-link">View all</Link>
              </div>

              {galleryItems.length === 0 ? (
                <p className="db-empty">No gallery items yet.</p>
              ) : (
                galleryItems.map((item) => (
                  <div className="db-list-item" key={item.id}>
                    <img src={resolveGalleryImage(item)} alt="" className="db-list-thumb" />
                    <div className="db-list-item-body">
                      <h4>{item.name}</h4>
                      <p>{item.category}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </section>

      <section className="db-section">
        <div className="db-section-head">
          <h2>Recent Activity</h2>
          <Link to="/feed" className="db-section-link">Go to Community Feed</Link>
        </div>

        <div className="db-list-card">
          {activityLoading ? (
            <>
              <div className="db-skeleton db-skeleton-line" />
              <div className="db-skeleton db-skeleton-line" />
              <div className="db-skeleton db-skeleton-line" />
            </>
          ) : recentPosts.length === 0 ? (
            <p className="db-empty">No community activity yet. Be the first to post.</p>
          ) : (
            recentPosts.map((post) => (
              <div className="db-activity-item" key={post.id}>
                <p>
                  <strong>{post.email}</strong> posted: {post.text}
                </p>
                <span className="db-activity-meta">{timeAgo(post.createdAt)}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
