function Fundraisers() {
  const campaigns = [
    {
      title: "Medical Supplies for North Kivu",
      goal: 10000,
      raised: 4500,
    },
    {
      title: "Support Displaced Families",
      goal: 25000,
      raised: 12000,
    },
    {
      title: "School Reconstruction Project",
      goal: 15000,
      raised: 7000,
    },
  ];

  return (
    <div className="fundraisers-page">
      <h1>💰 Diaspora Fundraising Center</h1>

      <p>
        Support verified projects helping Congolese communities.
      </p>

      <div className="cards">
        {campaigns.map((campaign, index) => {
          const progress =
            (campaign.raised / campaign.goal) * 100;

          return (
            <div className="card" key={index}>
              <h2>{campaign.title}</h2>

              <p>
                Raised: ${campaign.raised.toLocaleString()}
              </p>

              <p>
                Goal: ${campaign.goal.toLocaleString()}
              </p>

              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${progress}%`,
                  }}
                ></div>
              </div>

              <button>Donate</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Fundraisers;