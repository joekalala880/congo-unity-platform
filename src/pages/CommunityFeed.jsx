import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  increment,
  arrayUnion,
  onSnapshot,
  query,
  orderBy,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import Avatar from "../components/Avatar";
import VerificationBadge from "../components/identity/VerificationBadge";

function CommunityFeed() {
  const [posts, setPosts] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [postText, setPostText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [commentText, setCommentText] = useState("");
  const [editingPostId, setEditingPostId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");

  useEffect(() => {
    const loadProfiles = async () => {
      const snapshot = await getDocs(collection(db, "congoleseProfiles"));

      const data = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      }));

      setProfiles(data);
    };

    loadProfiles();
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, "communityPosts"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      }));

      setPosts(data);
    });

    return () => unsubscribe();
  }, []);

  const getProfile = (email) => {
    return profiles.find((profile) => profile.email === email);
  };

  const createPost = async (e) => {
    e.preventDefault();

    const user = auth.currentUser;

    if (!user) {
      alert("Please login first");
      return;
    }

    if (!postText.trim()) {
      alert("Write something first");
      return;
    }

    try {
      await addDoc(collection(db, "communityPosts"), {
        text: postText,
        imageUrl: imageUrl,
        email: user.email,
        userId: user.uid,
        likes: 0,
        comments: [],
        createdAt: new Date(),
      });

      setPostText("");
      setImageUrl("");
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  const likePost = async (id) => {
    await updateDoc(doc(db, "communityPosts", id), {
      likes: increment(1),
    });
  };

  const addComment = async (id) => {
    const user = auth.currentUser;

    if (!user) {
      alert("Please login first");
      return;
    }

    if (!commentText.trim()) {
      alert("Write a comment first");
      return;
    }

    const newComment = {
      text: commentText,
      email: user.email,
      createdAt: new Date().toISOString(),
    };

    await updateDoc(doc(db, "communityPosts", id), {
      comments: arrayUnion(newComment),
    });

    setCommentText("");
  };

  const startEditPost = (post) => {
    setEditingPostId(post.id);
    setEditText(post.text);
  };

  const saveEditPost = async (id) => {
    if (!editText.trim()) {
      alert("Post cannot be empty");
      return;
    }

    await updateDoc(doc(db, "communityPosts", id), {
      text: editText,
      updatedAt: new Date(),
    });

    setEditingPostId(null);
    setEditText("");
  };

  const deletePost = async (id) => {
    const confirmDelete = window.confirm("Delete this post?");
    if (!confirmDelete) return;

    await deleteDoc(doc(db, "communityPosts", id));
  };

  const startEditComment = (postId, commentIndex, commentTextValue) => {
    setEditingComment({ postId, commentIndex });
    setEditCommentText(commentTextValue);
  };

  const saveEditComment = async (post) => {
    if (!editCommentText.trim()) {
      alert("Comment cannot be empty");
      return;
    }

    const updatedComments = [...(post.comments || [])];

    updatedComments[editingComment.commentIndex] = {
      ...updatedComments[editingComment.commentIndex],
      text: editCommentText,
      updatedAt: new Date().toISOString(),
    };

    await updateDoc(doc(db, "communityPosts", post.id), {
      comments: updatedComments,
    });

    setEditingComment(null);
    setEditCommentText("");
  };

  const deleteComment = async (post, commentIndex) => {
    const confirmDelete = window.confirm("Delete this comment?");
    if (!confirmDelete) return;

    const updatedComments = [...(post.comments || [])];
    updatedComments.splice(commentIndex, 1);

    await updateDoc(doc(db, "communityPosts", post.id), {
      comments: updatedComments,
    });
  };

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>Community Feed</h1>
        <p>Share updates, stories, ideas, and images with the community.</p>
      </div>

      <form className="register-form" onSubmit={createPost}>
        <textarea
          placeholder="What's happening in the community?"
          value={postText}
          onChange={(e) => setPostText(e.target.value)}
        />

        <input
          type="text"
          placeholder="Image URL optional"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />

        <button type="submit">Create Post</button>
      </form>

      <div className="cards">
        {posts.map((post) => {
          const currentUser = auth.currentUser;
          const profile = getProfile(post.email);

          const isPostOwner =
            currentUser &&
            (post.userId === currentUser.uid ||
              post.email === currentUser.email);

          return (
            <div className="card" key={post.id}>
              <div className="post-user">
                <Avatar src={profile?.profileImageUrl} />

                <div>
                  <h3>
                    {profile
                      ? `${profile.firstName} ${profile.lastName}`
                      : post.email}
                    {profile && <VerificationBadge status={profile.status} />}
                  </h3>

                  <p>{profile?.province || "Province not set"}</p>
                </div>
              </div>

              {editingPostId === post.id ? (
                <>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                  />

                  <button onClick={() => saveEditPost(post.id)}>Save</button>

                  <button
                    onClick={() => {
                      setEditingPostId(null);
                      setEditText("");
                    }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <p>{post.text}</p>
              )}

              {post.imageUrl && (
                <img
                  src={post.imageUrl}
                  alt="Community post"
                  className="post-image"
                />
              )}

              <p>❤️ Likes: {post.likes || 0}</p>

              <button onClick={() => likePost(post.id)}>❤️ Like</button>

              {isPostOwner && (
                <div className="post-actions">
                  <button onClick={() => startEditPost(post)}>Edit Post</button>
                  <button onClick={() => deletePost(post.id)}>
                    Delete Post
                  </button>
                </div>
              )}

              <div className="share-buttons">
                <button
                  onClick={() =>
                    window.open(
                      `https://wa.me/?text=${encodeURIComponent(post.text)}`,
                      "_blank"
                    )
                  }
                >
                  WhatsApp
                </button>

                <button
                  onClick={() =>
                    window.open(
                      `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                        post.text
                      )}`,
                      "_blank"
                    )
                  }
                >
                  Share X
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(post.text);
                    alert("Post copied!");
                  }}
                >
                  Copy
                </button>
              </div>

              <hr />

              <h4>Comments ({post.comments?.length || 0})</h4>

              {(post.comments || []).map((comment, index) => {
                const isCommentOwner =
                  currentUser && comment.email === currentUser.email;

                const isEditingComment =
                  editingComment?.postId === post.id &&
                  editingComment?.commentIndex === index;

                return (
                  <div className="comment-box" key={index}>
                    <p>
                      <strong>{comment.email}</strong>
                    </p>

                    {isEditingComment ? (
                      <>
                        <input
                          type="text"
                          value={editCommentText}
                          onChange={(e) =>
                            setEditCommentText(e.target.value)
                          }
                        />

                        <button onClick={() => saveEditComment(post)}>
                          Save Comment
                        </button>

                        <button
                          onClick={() => {
                            setEditingComment(null);
                            setEditCommentText("");
                          }}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <p>{comment.text}</p>

                        {isCommentOwner && (
                          <div className="comment-actions">
                            <button
                              onClick={() =>
                                startEditComment(
                                  post.id,
                                  index,
                                  comment.text
                                )
                              }
                            >
                              Edit Comment
                            </button>

                            <button
                              onClick={() => deleteComment(post, index)}
                            >
                              Delete Comment
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}

              <input
                type="text"
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />

              <button onClick={() => addComment(post.id)}>Add Comment</button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default CommunityFeed;