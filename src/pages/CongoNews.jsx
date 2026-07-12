import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Link } from "react-router-dom";

function CongoNews() {
  const [news, setNews] = useState([]);

  useEffect(() => {
    const fetchNews = async () => {
      const snapshot = await getDocs(collection(db, "news"));

      const data = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      }));

      setNews(data);
    };

    fetchNews();
  }, []);

  return (
    <div className="news-page">
      <section className="news-hero">
        <div className="news-overlay">
          <h1>Congo News & Truth</h1>
          <h3>Facts over propaganda. Truth with responsibility.</h3>

          <p>
            A verified news space for Congo, the East crisis, politics,
            diaspora action, culture, and community updates.
          </p>

          <Link to="/create-news">
            <button>Create News</button>
          </Link>
        </div>
      </section>

      <section className="news-section">
        <h2>Latest News</h2>

        <div className="cards">
          {news.length === 0 ? (
            <div className="card">
              <h3>No news published yet</h3>
              <p>Create the first news article.</p>
            </div>
          ) : (
            news.map((item) => (
              <div className="card" key={item.id}>
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="post-image"
                  />
                )}

               <Link to={`/news/${item.id}`}>
  <h3>{item.title}</h3>
</Link>

                <p>
                  <strong>Category:</strong> {item.category}
                </p>

                <p>
                  <strong>Location:</strong> {item.location}
                </p>

                <p>{item.summary}</p>

                {item.sourceLink && (
                  <a href={item.sourceLink} target="_blank" rel="noreferrer">
                    <button>Read Source</button>
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default CongoNews;