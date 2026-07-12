import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

function NewsDetails() {
  const { id } = useParams();
  const [news, setNews] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      const ref = doc(db, "news", id);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setNews({
          id: snap.id,
          ...snap.data(),
        });
      }
    };

    fetchNews();
  }, [id]);

  if (!news) {
    return (
      <section className="register-section">
        <h2>Loading news...</h2>
      </section>
    );
  }

  return (
    <section className="register-section">
      <div className="card">
        {news.imageUrl && (
          <img src={news.imageUrl} alt={news.title} className="post-image" />
        )}

        <h1>{news.title}</h1>

        <p>
          <strong>Category:</strong> {news.category}
        </p>

        <p>
          <strong>Location:</strong> {news.location}
        </p>

        <h3>Summary</h3>
        <p>{news.summary}</p>

        <h3>Full Story</h3>
        <p>{news.content}</p>

        {news.sourceLink && (
          <a href={news.sourceLink} target="_blank" rel="noreferrer">
            <button>Read Source</button>
          </a>
        )}

        <Link to="/news">
          <button>Back to News</button>
        </Link>
      </div>
    </section>
  );
}

export default NewsDetails;