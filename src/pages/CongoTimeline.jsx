import "./CongoTimeline.css";

function CongoTimeline() {
  const events = [
    {
      year: "1885",
      title: "Congo Free State",
      description:
        "King Leopold II established the Congo Free State, marking the beginning of colonial rule.",
    },
    {
      year: "1960",
      title: "Independence",
      description:
        "The Democratic Republic of the Congo gained independence on June 30, 1960.",
    },
    {
      year: "1961",
      title: "Patrice Lumumba",
      description:
        "The first Prime Minister of independent Congo became a national symbol of freedom.",
    },
    {
      year: "1965",
      title: "Mobutu Sese Seko",
      description:
        "Mobutu became president and ruled the country for more than three decades.",
    },
    {
      year: "1997",
      title: "Laurent-Désiré Kabila",
      description:
        "Mobutu's government ended and Laurent Kabila became president.",
    },
    {
      year: "2001",
      title: "Joseph Kabila",
      description:
        "Joseph Kabila became president following the assassination of his father.",
    },
    {
      year: "2019",
      title: "Félix Tshisekedi",
      description:
        "The country experienced its first peaceful transfer of presidential power.",
    },
    {
      year: "Today",
      title: "Congo Unity Platform",
      description:
        "Connecting Congolese people around the world through history, culture, education, and innovation.",
    },
  ];

  return (
    <div className="timeline-page">
      <h1>🇨🇩 Congo Historical Timeline</h1>

      <p className="timeline-intro">
        Explore the major moments that shaped the Democratic Republic of the Congo.
      </p>

      <div className="timeline">
        {events.map((event, index) => (
          <div className="timeline-card" key={index}>
            <h2>{event.year}</h2>
            <h3>{event.title}</h3>
            <p>{event.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CongoTimeline;