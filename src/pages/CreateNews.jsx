import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

function CreateNews() {
  const [news, setNews] = useState({
    title: "",
    category: "",
    location: "",
    imageUrl: "",
    summary: "",
    content: "",
    sourceLink: "",
  });

  const handleChange = (e) => {
    setNews({
      ...news,
      [e.target.name]: e.target.value,
    });
  };

  const submitNews = async (e) => {
    e.preventDefault();

    const user = auth.currentUser;

    if (!user) {
      alert("Please login first");
      return;
    }

    if (!news.title || !news.summary || !news.content) {
      alert("Please fill title, summary, and content");
      return;
    }

    try {
      await addDoc(collection(db, "news"), {
        ...news,
        createdBy: user.email,
        createdAt: new Date(),
        status: "published",
      });

      alert("News published successfully!");

      setNews({
        title: "",
        category: "",
        location: "",
        imageUrl: "",
        summary: "",
        content: "",
        sourceLink: "",
      });
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>Create News</h1>
        <p>Publish verified news and community updates.</p>
      </div>

      <form className="register-form" onSubmit={submitNews}>
        <input
          name="title"
          value={news.title}
          onChange={handleChange}
          placeholder="News Title"
        />

        <input
          name="category"
          value={news.category}
          onChange={handleChange}
          placeholder="Category"
        />

        <input
          name="location"
          value={news.location}
          onChange={handleChange}
          placeholder="Location"
        />

        <input
          name="imageUrl"
          value={news.imageUrl}
          onChange={handleChange}
          placeholder="Image URL optional"
        />

        <textarea
          name="summary"
          value={news.summary}
          onChange={handleChange}
          placeholder="Short Summary"
        />

        <textarea
          name="content"
          value={news.content}
          onChange={handleChange}
          placeholder="Full News Content"
        />

        <input
          name="sourceLink"
          value={news.sourceLink}
          onChange={handleChange}
          placeholder="Source Link optional"
        />

        <button type="submit">Publish News</button>
      </form>
    </section>
  );
}

export default CreateNews;