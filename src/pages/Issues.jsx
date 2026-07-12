import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  increment,
  arrayUnion,
} from "firebase/firestore";
import { auth, db } from "../firebase";

function Issues() {
  const [issues, setIssues] = useState([]);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    const fetchIssues = async () => {
      const querySnapshot = await getDocs(collection(db, "issues"));

      const data = querySnapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      }));

      setIssues(data);
    };

    fetchIssues();
  }, []);

  const supportIssue = async (id) => {
    await updateDoc(doc(db, "issues", id), {
      supportVotes: increment(1),
    });

    setIssues((prev) =>
      prev.map((issue) =>
        issue.id === id
          ? { ...issue, supportVotes: (issue.supportVotes || 0) + 1 }
          : issue
      )
    );
  };

  const opposeIssue = async (id) => {
    await updateDoc(doc(db, "issues", id), {
      opposeVotes: increment(1),
    });

    setIssues((prev) =>
      prev.map((issue) =>
        issue.id === id
          ? { ...issue, opposeVotes: (issue.opposeVotes || 0) + 1 }
          : issue
      )
    );
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

    await updateDoc(doc(db, "issues", id), {
      comments: arrayUnion(newComment),
    });

    setIssues((prev) =>
      prev.map((issue) =>
        issue.id === id
          ? {
              ...issue,
              comments: [...(issue.comments || []), newComment],
            }
          : issue
      )
    );

    setCommentText("");
  };

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>Reported Issues</h1>
        <p>View issues submitted by Congolese community members.</p>
      </div>

      <div className="card">
        <h3>Total Issues</h3>
        <p>{issues.length}</p>
      </div>

      <div className="cards">
        {issues.map((issue) => (
          <div className="card" key={issue.id}>
            <h3>{issue.title}</h3>

            <p><strong>Category:</strong> {issue.category}</p>
            <p><strong>Province:</strong> {issue.province}</p>
            <p><strong>Status:</strong> {issue.status}</p>
            <p>{issue.description}</p>
            <p><strong>Reported By:</strong> {issue.email}</p>

            <p>👍 Support: {issue.supportVotes || 0}</p>
            <p>👎 Oppose: {issue.opposeVotes || 0}</p>

            <div className="vote-buttons">
              <button onClick={() => supportIssue(issue.id)}>👍 Support</button>
              <button onClick={() => opposeIssue(issue.id)}>👎 Oppose</button>
            </div>

            <hr />

           <h4>
  Comments ({issue.comments?.length || 0})
</h4>

            {(issue.comments || []).map((comment, index) => (
              <div key={index}>
                <p><strong>{comment.email}</strong></p>
           <p>{comment.text}</p>

<small>
  {new Date(comment.createdAt).toLocaleString()}
</small>
              </div>
            ))}

            <input
              type="text"
              placeholder="Write a comment..."
              onChange={(e) => setCommentText(e.target.value)}
            />

            <button onClick={() => addComment(issue.id)}>
              Add Comment
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Issues;