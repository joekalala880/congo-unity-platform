import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

function GovernmentDashboard() {
  const [members, setMembers] = useState([]);
  const [issues, setIssues] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const membersSnapshot = await getDocs(collection(db, "congoleseProfiles"));
      const issuesSnapshot = await getDocs(collection(db, "issues"));

      setMembers(membersSnapshot.docs.map((doc) => doc.data()));
      setIssues(issuesSnapshot.docs.map((doc) => doc.data()));
    };

    loadData();
  }, []);

  const provinceCounts = members.reduce((acc, member) => {
    const province = member.province || "Unknown";
    acc[province] = (acc[province] || 0) + 1;
    return acc;
  }, {});

  const categoryCounts = issues.reduce((acc, issue) => {
    const category = issue.category || "Unknown";
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>Government Dashboard</h1>
        <p>National overview of members and reported issues.</p>
      </div>

      <div className="cards">
        <div className="card">
          <h2>{members.length}</h2>
          <p>Total Members</p>
        </div>

        <div className="card">
          <h2>{issues.length}</h2>
          <p>Total Issues</p>
        </div>
      </div>

      <h2>Members by Province</h2>
      <div className="cards">
        {Object.entries(provinceCounts).map(([province, count]) => (
          <div className="card" key={province}>
            <h3>{province}</h3>
            <p>{count} member(s)</p>
          </div>
        ))}
      </div>

      <h2>Issues by Category</h2>
      <div className="cards">
        {Object.entries(categoryCounts).map(([category, count]) => (
          <div className="card" key={category}>
            <h3>{category}</h3>
            <p>{count} issue(s)</p>
          </div>
        ))}
      </div>

      <h2>Recent Issues</h2>
      <div className="cards">
        {issues.slice(0, 5).map((issue, index) => (
          <div className="card" key={index}>
            <h3>{issue.title}</h3>
            <p><strong>Province:</strong> {issue.province}</p>
            <p><strong>Category:</strong> {issue.category}</p>
            <p><strong>Status:</strong> {issue.status}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default GovernmentDashboard;