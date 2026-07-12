import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "../firebase";

function DirectMessages() {
  const [messages, setMessages] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");

  const [message, setMessage] = useState({
    to: "",
    text: "",
  });

  const [loadingProfiles, setLoadingProfiles] = useState(true);
  // No signed-in user means there's nothing to load (this page is also
  // gated by ProtectedRoute, so that shouldn't normally happen here).
  const [loadingMessages, setLoadingMessages] = useState(() => Boolean(auth.currentUser));
  const [profilesError, setProfilesError] = useState(null);
  const [messagesError, setMessagesError] = useState(null);

  useEffect(() => {
    const fetchProfiles = async () => {
      setLoadingProfiles(true);
      setProfilesError(null);

      try {
        const snapshot = await getDocs(collection(db, "congoleseProfiles"));

        const data = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        setProfiles(data);
      } catch (error) {
        console.error("Failed to load community members:", error);
        setProfilesError(
          "We couldn't load community members right now. Please try again later."
        );
      } finally {
        setLoadingProfiles(false);
      }
    };

    fetchProfiles();
  }, []);

  useEffect(() => {
    const user = auth.currentUser;

    if (!user) return;

    // Firestore rules only allow reading messages where the signed-in user
    // is the sender or recipient, so a single unfiltered query would be
    // denied outright. Two participant-scoped queries are merged instead.
    const sentQuery = query(
      collection(db, "messages"),
      where("from", "==", user.email),
      orderBy("createdAt", "asc")
    );

    const receivedQuery = query(
      collection(db, "messages"),
      where("to", "==", user.email),
      orderBy("createdAt", "asc")
    );

    let sentMessages = [];
    let receivedMessages = [];
    let sentLoaded = false;
    let receivedLoaded = false;

    const mergeAndSetMessages = () => {
      const merged = new Map();

      [...sentMessages, ...receivedMessages].forEach((msg) => {
        merged.set(msg.id, msg);
      });

      const sorted = Array.from(merged.values()).sort(
        (a, b) => (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0)
      );

      setMessages(sorted);
    };

    const handleSnapshotError = (label) => (error) => {
      console.error(`Failed to load ${label} messages:`, error);
      setMessagesError(
        "We couldn't load your messages right now. Please try again later."
      );
      setLoadingMessages(false);
    };

    const unsubscribeSent = onSnapshot(
      sentQuery,
      (snapshot) => {
        sentMessages = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        sentLoaded = true;
        if (sentLoaded && receivedLoaded) setLoadingMessages(false);
        mergeAndSetMessages();
      },
      handleSnapshotError("sent")
    );

    const unsubscribeReceived = onSnapshot(
      receivedQuery,
      (snapshot) => {
        receivedMessages = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        receivedLoaded = true;
        if (sentLoaded && receivedLoaded) setLoadingMessages(false);
        mergeAndSetMessages();
      },
      handleSnapshotError("received")
    );

    return () => {
      unsubscribeSent();
      unsubscribeReceived();
    };
  }, []);

  const handleChange = (e) => {
    setMessage({
      ...message,
      [e.target.name]: e.target.value,
    });
  };

  const sendMessage = async (e) => {
    e.preventDefault();

    const user = auth.currentUser;

    if (!user) {
      alert("Please login first");
      return;
    }

    if (!message.to || !message.text) {
      alert("Please select a recipient and write a message");
      return;
    }

    await addDoc(collection(db, "messages"), {
      from: user.email,
      to: message.to,
      text: message.text,
      createdAt: new Date(),
    });

    setSelectedUser(message.to);

    setMessage({
      to: "",
      text: "",
    });
  };

  const currentUserEmail = auth.currentUser?.email;

  const conversations = [
    ...new Set(
      messages.map((msg) =>
        msg.from === currentUserEmail ? msg.to : msg.from
      )
    ),
  ];

  const selectedMessages = messages.filter(
    (msg) => msg.from === selectedUser || msg.to === selectedUser
  );

  const availableProfiles = profiles.filter(
    (profile) => profile.email !== currentUserEmail
  );

  if (loadingProfiles || loadingMessages) {
    return (
      <section className="register-section">
        <div className="register-header">
          <h1>Direct Messages</h1>
          <p>Loading your conversations...</p>
        </div>
      </section>
    );
  }

  if (profilesError || messagesError) {
    return (
      <section className="register-section">
        <div className="register-header">
          <h1>Direct Messages</h1>
          <p>{profilesError || messagesError}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>Direct Messages</h1>
        <p>Real-time private inbox for community members.</p>
      </div>

      <form className="register-form" onSubmit={sendMessage}>
        <select name="to" value={message.to} onChange={handleChange}>
          <option value="">Select Recipient</option>

          {availableProfiles.map((profile) => (
            <option key={profile.id} value={profile.email}>
              {profile.firstName} {profile.lastName} — {profile.email}
            </option>
          ))}
        </select>

        <textarea
          name="text"
          value={message.text}
          placeholder="Write your message..."
          onChange={handleChange}
        ></textarea>

        <button type="submit">Send Message</button>
      </form>

      <div className="inbox-layout">
        <div className="conversation-list">
          <h3>Conversations</h3>

          {conversations.length === 0 ? (
            <p>No conversations yet.</p>
          ) : (
            conversations.map((email) => (
              <button
                key={email}
                onClick={() => setSelectedUser(email)}
                className={selectedUser === email ? "conversation-active" : ""}
              >
                {email}
              </button>
            ))
          )}
        </div>

        <div className="message-window">
          <h3>
            {selectedUser
              ? `Conversation with ${selectedUser}`
              : "Select a conversation"}
          </h3>

          {selectedUser &&
            selectedMessages.map((msg) => (
              <div
                className={
                  msg.from === currentUserEmail
                    ? "message-bubble mine"
                    : "message-bubble theirs"
                }
                key={msg.id}
              >
                <p>{msg.text}</p>
                <small>{msg.from}</small>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}

export default DirectMessages;