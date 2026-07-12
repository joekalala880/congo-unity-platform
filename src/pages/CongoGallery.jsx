import fally from "../galery photo/fally.jpeg";
import koffi from "../galery photo/koffi Olomide.jpeg";
import franco from "../galery photo/franco luambo.jpg";
import kabila from "../galery photo/Joseph kabila.webp";
import flag from "../galery photo/FlagCongo.webp";
import kinshasa from "../galery photo/congp-730x410.jpg";
import boulevard from "../galery photo/Boulevard-du-30-Juin-street-Kinshasa-Democratic.webp";
import eastCongo from "../galery photo/DR Congo hero.avif";

function CongoGallery() {
  const galleryItems = [
    {
      name: "Fally Ipupa",
      category: "Music & Culture",
      image: fally,
      description:
        "A modern Congolese music icon who brought Congolese sound to the world.",
    },
    {
      name: "Koffi Olomidé",
      category: "Music Legend",
      image: koffi,
      description:
        "One of the major voices of Congolese rumba and African music.",
    },
    {
      name: "Franco Luambo",
      category: "Congolese Rumba",
      image: franco,
      description:
        "A legendary figure whose music helped shape Congolese identity.",
    },
    {
      name: "Joseph Kabila",
      category: "Politics & History",
      image: kabila,
      description:
        "A political figure connected to an important chapter of Congo’s modern history.",
    },
    {
      name: "Kinshasa",
      category: "City & Identity",
      image: kinshasa,
      description:
        "The capital city, full of energy, music, politics, creativity, and movement.",
    },
    {
      name: "Boulevard du 30 Juin",
      category: "Kinshasa Memory",
      image: boulevard,
      description:
        "One of Kinshasa’s most symbolic roads, representing movement and national life.",
    },
    {
      name: "Eastern Congo",
      category: "Memory & Crisis",
      image: eastCongo,
      description:
        "A place of pain, resilience, and courage. Congo Unity remembers the East.",
    },
    {
      name: "Flag of the DRC",
      category: "National Symbol",
      image: flag,
      description:
        "The flag reminds us that we are one people, even when everything tries to divide us.",
    },
  ];

  return (
    <div className="gallery-page">
      <section className="gallery-hero">
        <div className="gallery-overlay">
          <h1>Congo Memory & Influence Gallery</h1>
          <h3>Our people. Our culture. Our memory. Our future.</h3>

          <p>
            A visual space to honor Congolese music, politics, history, cities,
            national symbols, and the memory of Eastern Congo.
          </p>
        </div>
      </section>

      <section className="gallery-section">
        <h2>Explore Congo’s Memory</h2>

        <div className="gallery-categories">
          <button>All</button>
          <button>Music</button>
          <button>Politics</button>
          <button>History</button>
          <button>Cities</button>
          <button>Nature</button>
          <button>Sports</button>
          <button>Culture</button>
        </div>

        <div className="gallery-grid">
          {galleryItems.map((item, index) => (
            <div className="gallery-card" key={index}>
              <img src={item.image} alt={item.name} />

              <div className="gallery-card-content">
                <h3>{item.name}</h3>
                <h4>{item.category}</h4>
                <p>{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default CongoGallery;