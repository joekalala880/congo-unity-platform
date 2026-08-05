import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";
import Avatar from "../components/Avatar";
import VerificationBadge from "../components/identity/VerificationBadge";
import {
  getOrCreateConversation,
  listenToConversations,
  listenToMessages,
  markConversationRead,
  sendMessage,
} from "../services/messagingService";
import "./DirectMessages.css";

function profileName(profile) {
  if (!profile) return "Unknown user";
  const name = `${profile.firstName || ""} ${profile.lastName || ""}`.trim();
  return name || profile.email || "Unknown user";
}

function formatTimestamp(value) {
  if (!value) return "";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  return isToday
    ? date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function ConversationRowSkeleton() {
  return (
    <div className="dm-row">
      <div className="dm-skeleton dm-skeleton-avatar" />
      <div className="dm-row-text">
        <div className="dm-skeleton" style={{ width: "60%", height: 14 }} />
        <div className="dm-skeleton" style={{ width: "80%", height: 12, marginTop: 6 }} />
      </div>
    </div>
  );
}

function DirectMessages() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [profilesById, setProfilesById] = useState({});

  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [conversationsError, setConversationsError] = useState("");

  const [selectedId, setSelectedId] = useState(null);
  // Keyed by conversationId rather than a single flat { messages, loading,
  // error } trio — that lets "loading" be *derived* (no entry yet for the
  // current selectedId) instead of a value some effect has to set
  // synchronously to true right when selectedId changes.
  const [messagesByConversation, setMessagesByConversation] = useState({});

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [actionError, setActionError] = useState("");

  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState("");

  const bottomRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        const snapshot = await getDocs(collection(db, "congoleseProfiles"));
        const map = {};
        snapshot.docs.forEach((d) => {
          map[d.id] = { id: d.id, ...d.data() };
        });
        setProfilesById(map);
      } catch (err) {
        console.error("Failed to load profiles:", err);
      }
    })();
  }, [user]);

  useEffect(() => {
    // Nothing to load without a signed-in user — the component renders an
    // entirely different "please log in" branch in that case, so
    // `conversationsLoading` (default true) is never read from that path.
    // Loading only ever needs to go true->false once here (this effect
    // only re-runs if `user` changes identity, which doesn't happen while
    // mounted), so it's left at its default `true` rather than set
    // synchronously — only the onSnapshot callbacks below set it to false.
    if (!user) return;

    const unsubscribe = listenToConversations(
      user.uid,
      (convos) => {
        setConversations(convos);
        setConversationsLoading(false);
      },
      (err) => {
        console.error("Failed to load conversations:", err);
        setConversationsError("We couldn't load your conversations right now. Please try again.");
        setConversationsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Deep-link support: /direct-messages?with=<uid> from a profile page or a
  // notification. Resolves (or creates) the conversation, then clears the
  // param so it doesn't re-trigger on every re-render.
  useEffect(() => {
    const withUid = searchParams.get("with");
    if (!user || !withUid || withUid === user.uid) return;

    getOrCreateConversation(user, withUid)
      .then((id) => {
        setSelectedId(id);
        const next = new URLSearchParams(searchParams);
        next.delete("with");
        setSearchParams(next, { replace: true });
      })
      .catch((err) => {
        console.error("Failed to start conversation:", err);
        setActionError(err.message || "Couldn't start that conversation.");
      });
  }, [user, searchParams, setSearchParams]);

  useEffect(() => {
    if (!selectedId) return;

    const unsubscribe = listenToMessages(
      selectedId,
      (msgs) => {
        setMessagesByConversation((prev) => ({ ...prev, [selectedId]: { messages: msgs, error: "" } }));
      },
      (err) => {
        console.error("Failed to load messages:", err);
        setMessagesByConversation((prev) => ({
          ...prev,
          [selectedId]: { messages: [], error: "We couldn't load this conversation right now. Please try again." },
        }));
      }
    );

    return () => unsubscribe();
  }, [selectedId]);

  const currentThread = selectedId ? messagesByConversation[selectedId] : null;
  const messages = useMemo(() => currentThread?.messages || [], [currentThread]);
  const messagesError = currentThread?.error || "";
  const messagesLoading = Boolean(selectedId) && !currentThread;

  // Marks incoming messages read whenever the thread is open, including as
  // new ones arrive live — matches "read receipt" behavior for an actively
  // viewed conversation.
  useEffect(() => {
    if (!selectedId || !user) return;
    markConversationRead(selectedId, user.uid).catch((err) =>
      console.error("Failed to mark conversation read:", err)
    );
  }, [selectedId, user, messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedId]);

  const selectedConversation = conversations.find((c) => c.id === selectedId) || null;
  const otherUid = selectedConversation?.participants.find((p) => p !== user?.uid);
  const otherProfile = otherUid ? profilesById[otherUid] : null;

  const handleSend = async () => {
    if (!text.trim() || sending || !selectedConversation || !user || !otherProfile) return;

    setSending(true);
    setActionError("");

    const myName = profileName(profilesById[user.uid]);

    try {
      await sendMessage({
        conversationId: selectedConversation.id,
        sender: user,
        senderName: myName,
        recipientId: otherUid,
        recipientEmail: otherProfile.email,
        text,
      });
      setText("");
    } catch (err) {
      console.error("Failed to send message:", err);
      setActionError(err.message || "Couldn't send your message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStartConversation = async (targetUid) => {
    if (!user || targetUid === user.uid) return;
    setActionError("");

    try {
      const id = await getOrCreateConversation(user, targetUid);
      setSelectedId(id);
      setShowSearch(false);
      setSearch("");
    } catch (err) {
      console.error("Failed to start conversation:", err);
      setActionError(err.message || "Couldn't start that conversation.");
    }
  };

  if (authLoading) {
    return (
      <section className="register-section">
        <div className="register-header">
          <h1>Messages</h1>
          <p>Loading…</p>
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="register-section">
        <div className="register-header">
          <h1>Messages</h1>
          <p>Please log in to view your conversations.</p>
        </div>
      </section>
    );
  }

  const searchResults = search.trim()
    ? Object.values(profilesById).filter((p) => {
        if (p.id === user.uid) return false;
        const haystack = `${p.firstName || ""} ${p.lastName || ""} ${p.email || ""}`.toLowerCase();
        return haystack.includes(search.trim().toLowerCase());
      })
    : [];

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>Messages</h1>
        <p>Real-time private conversations with Congo Unity members.</p>
      </div>

      {actionError && <p className="register-form__error" role="alert">{actionError}</p>}

      <div className={`dm-layout ${selectedId ? "dm-has-selection" : ""}`}>
        <div className="dm-list-pane">
          <div className="dm-list-header">
            <h3>Conversations</h3>
            <button type="button" onClick={() => setShowSearch((s) => !s)}>
              {showSearch ? "Cancel" : "New Message"}
            </button>
          </div>

          {showSearch && (
            <div className="dm-search">
              <input
                type="text"
                placeholder="Search by name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search users to message"
                autoFocus
              />
              <div className="dm-search-results">
                {search.trim() && searchResults.length === 0 && <p className="dm-empty">No users found.</p>}
                {searchResults.map((p) => (
                  <button type="button" className="dm-search-result" key={p.id} onClick={() => handleStartConversation(p.id)}>
                    <Avatar src={p.profileImageUrl} className="dm-avatar-sm" alt={profileName(p)} />
                    <span className="dm-search-result-name">{profileName(p)}</span>
                    <VerificationBadge status={p.status} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {conversationsError && <p className="register-form__error" role="alert">{conversationsError}</p>}

          <div className="dm-conversation-list">
            {conversationsLoading ? (
              <>
                <ConversationRowSkeleton />
                <ConversationRowSkeleton />
              </>
            ) : conversations.length === 0 ? (
              <p className="dm-empty">No conversations yet. Search for someone to start chatting.</p>
            ) : (
              conversations.map((c) => {
                const otherId = c.participants.find((p) => p !== user.uid);
                const profile = profilesById[otherId];
                const unread = c.unreadCount?.[user.uid] || 0;
                const lastMessage = c.lastMessage;
                const preview = lastMessage
                  ? `${lastMessage.senderId === user.uid ? "You: " : ""}${lastMessage.text}`
                  : "No messages yet";

                return (
                  <button
                    type="button"
                    key={c.id}
                    className={`dm-row ${selectedId === c.id ? "dm-row-active" : ""}`}
                    onClick={() => setSelectedId(c.id)}
                  >
                    <Avatar src={profile?.profileImageUrl} className="dm-avatar" alt={profileName(profile)} />
                    <div className="dm-row-text">
                      <div className="dm-row-top">
                        <strong>{profileName(profile)}</strong>
                        <span className="dm-row-time">{formatTimestamp(lastMessage?.createdAt)}</span>
                      </div>
                      <div className="dm-row-bottom">
                        <p className="dm-row-preview">{preview}</p>
                        {unread > 0 && <span className="dm-unread-badge">{unread}</span>}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="dm-thread-pane">
          {!selectedConversation ? (
            <div className="dm-thread-empty">
              <p>Select a conversation or start a new one.</p>
            </div>
          ) : (
            <>
              <div className="dm-thread-header">
                <button type="button" className="dm-back-button" onClick={() => setSelectedId(null)} aria-label="Back to conversations">
                  ←
                </button>
                <Avatar src={otherProfile?.profileImageUrl} className="dm-avatar" alt={profileName(otherProfile)} />
                <div>
                  <strong>{profileName(otherProfile)}</strong>
                  {otherProfile && <VerificationBadge status={otherProfile.status} />}
                </div>
              </div>

              <div className="dm-thread-messages">
                {messagesLoading ? (
                  <p className="dm-empty">Loading messages…</p>
                ) : messagesError ? (
                  <p className="register-form__error" role="alert">{messagesError}</p>
                ) : messages.length === 0 ? (
                  <p className="dm-empty">No messages yet. Say hello to start the conversation.</p>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className={`dm-bubble ${m.senderId === user.uid ? "dm-bubble-mine" : "dm-bubble-theirs"}`}>
                      <p>{m.text}</p>
                      <span className="dm-bubble-meta">
                        {formatTimestamp(m.createdAt)}
                        {m.senderId === user.uid && <span className="dm-read-state">{m.read ? " · Read" : " · Sent"}</span>}
                      </span>
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              <div className="dm-composer">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Write a message… (Enter to send, Shift+Enter for a new line)"
                  aria-label="Message text"
                  disabled={sending}
                />
                <button type="button" onClick={handleSend} disabled={sending || !text.trim()}>
                  {sending ? "Sending…" : "Send"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default DirectMessages;
