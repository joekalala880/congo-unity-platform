import "./App.css";
import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UploadID from "./pages/UploadID";
import IdentityDocuments from "./pages/IdentityDocuments";
import IdentityDashboard from "./pages/IdentityDashboard";
import VerifyCitizenId from "./pages/VerifyCitizenId";
import Directory from "./pages/Directory";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import ReportIssue from "./pages/ReportIssue";
import Issues from "./pages/Issues";

import AdminDashboard from "./pages/AdminDashboard";
import GovernmentDashboard from "./pages/GovernmentDashboard";
import VerifyCitizens from "./pages/VerifyCitizens";
import AdminGalleryManager from "./pages/AdminGalleryManager";
import AccountSuspended from "./pages/AccountSuspended";
import AdminUserManagement from "./pages/AdminUserManagement";
import AdminVerificationQueue from "./pages/AdminVerificationQueue";
import ProtectedAdmin from "./components/ProtectedAdmin";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";

import DiasporaHub from "./pages/DiasporaHub";
import EastCrisis from "./pages/EastCrisis";
import MemoryWall from "./pages/MemoryWall";
import CongoNews from "./pages/CongoNews";
import Culture from "./pages/Culture";
import OSINTCenter from "./pages/OSINTCenter";
import TakeAction from "./pages/TakeAction";
import Announcements from "./pages/Announcements";
import CreateAnnouncement from "./pages/CreateAnnouncement";
import EmergencyAlerts from "./pages/EmergencyAlerts";
import CrisisAlerts from "./pages/CrisisAlerts";
import EmergencyResponse from "./pages/EmergencyResponse";
import AidDirectory from "./pages/AidDirectory";
import Partners from "./pages/Partners";

import Fundraisers from "./pages/Fundraisers";
import Events from "./pages/Events";
import Businesses from "./pages/Businesses";
import CommunityFeed from "./pages/CommunityFeed";
import SuccessStories from "./pages/SuccessStories";
import Volunteer from "./pages/Volunteer";
import Jobs from "./pages/Jobs";
import CreateJob from "./pages/CreateJob";
import Scholarships from "./pages/Scholarships";
import CreateScholarship from "./pages/CreateScholarship";

import DirectMessages from "./pages/DirectMessages";
import CongoMap from "./pages/CongoMap";
import Languages from "./pages/Languages";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import HelpSupport from "./pages/HelpSupport";
import UserManagement from "./pages/UserManagement";
import ProfilePicture from "./pages/ProfilePicture";

import DiasporaDirectory from "./pages/DiasporaDirectory";
import DashboardHub from "./pages/DashboardHub";
import FollowSystem from "./pages/FollowSystem";
import FollowersPage from "./pages/FollowersPage";
import FollowingPage from "./pages/FollowingPage";
import SearchUsers from "./pages/SearchUsers";
import PublicProfile from "./pages/PublicProfile";
import CongoGallery from "./pages/CongoGallery";
import CongoTimeline from "./pages/CongoTimeline";
import AdminCMS from "./pages/AdminCMS";
import CreateEvent from "./pages/CreateEvent";
import CreateNews from "./pages/CreateNews";
import CreateBusiness from "./pages/CreateBusiness";
import GlobalSearch from "./pages/GlobalSearch";
import JobDetails from "./pages/JobDetails";
import BusinessDetails from "./pages/BusinessDetails";
import ScholarshipDetails from "./pages/ScholarshipDetails";
import EventDetails from "./pages/EventDetails";
import NewsDetails from "./pages/NewsDetails";
import SavedItems from "./pages/SavedItems";


function Home() {

  const [homeData, setHomeData] = useState({
  jobs: [],
  scholarships: [],
  events: [],
  posts: [],
  members: [],
});

useEffect(() => {
  const fetchHomeData = async () => {
    const jobsSnap = await getDocs(collection(db, "jobs"));
    const scholarshipsSnap = await getDocs(collection(db, "scholarships"));
    const eventsSnap = await getDocs(collection(db, "events"));
    const postsSnap = await getDocs(collection(db, "communityPosts"));
    const membersSnap = await getDocs(collection(db, "congoleseProfiles"));

    setHomeData({
      jobs: jobsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })).slice(0, 3),
      scholarships: scholarshipsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })).slice(0, 3),
      events: eventsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })).slice(0, 3),
      posts: postsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })).slice(0, 3),
      members: membersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })).slice(0, 3),
    });
  };

  fetchHomeData();
}, []);
  return (
    <div className="app">
      <section className="hero-section">
        <div className="hero-content">
          <h1>Putting All Congolese Together</h1>

          <h3 className="slogan">
            “We are one, even when everything tries to divide us.”
          </h3>

          <p>
            A digital platform connecting Congolese communities worldwide.
            Together we preserve truth, strengthen identity, support our people,
            and build a stronger future for Congo.
          </p>

          <div className="nav-links">
            <a href="#mission">Mission</a>
            <a href="#features">Features</a>
          </div>

          <div className="hero-buttons">
            <Link to="/register">
              <button>Join the Community</button>
            </Link>

            <Link to="/issues">
              <button>View Issues</button>
            </Link>

            <Link to="/directory">
              <button>Find Citizens</button>
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>Eastern Congo Crisis</h2>

        <div className="cards">
          <div className="card">
            <h3>Displaced People</h3>
            <p>7,000,000+</p>
          </div>

          <div className="card">
            <h3>Lives Lost</h3>
            <p>Thousands</p>
          </div>

          <div className="card">
            <h3>Diaspora Members</h3>
            <p>Coming Soon</p>
          </div>
        </div>
      </section>

      <section id="mission" className="section">
        <h2>Our Mission</h2>

        <p>
          Congo Unity Platform tells the story of a resilient people who refuse
          to be broken. From Kinshasa to Goma, from Lubumbashi to New York,
          Paris, Brussels, and Toronto, we are one people connected by history,
          culture, pain, hope, and future.
        </p>
      </section>

      <section className="section">
        <h2>The Congo Story</h2>

        <p>
          Congo is one of the richest countries on Earth, yet millions of its
          people continue to suffer. This platform exists to preserve memory,
          share truth, support the abandoned, mobilize the diaspora, and build
          unity across every province and every community abroad.
        </p>
      </section>

      <section id="features" className="cards">
        <div className="card">
          <h3>Identity Directory</h3>
          <p>
            Connect Congolese citizens from every province and diaspora
            community around the world.
          </p>
        </div>

        <div className="card">
          <h3>Issue Reporting</h3>
          <p>
            Report local and national issues, vote on solutions, comment, and
            mobilize communities to create change.
          </p>
        </div>

        <div className="card">
          <h3>Government Dashboard</h3>
          <p>
            View statistics, community trends, citizen reports, and national
            insights to support better decision-making.
          </p>
        </div>

        <div className="card">
          <h3>Diaspora Hub</h3>
          <p>
            Unite Congolese communities in the USA, Canada, Europe, Africa, and
            around the world.
          </p>
        </div>
      </section>

      <section className="section">
        <h2>Hope & Resilience</h2>
        <p>
          Congo is more than suffering. It is students, entrepreneurs, artists,
          engineers, nurses, builders, parents, leaders, and young people
          fighting every day for a better tomorrow.
        </p>
      </section>

      <section className="section">
        <h2>Global Congolese Diaspora</h2>
        <p>
          Congolese people around the world carry the weight of distance and
          longing, but also the power to advocate, organize, invest, and support
          communities back home.
        </p>

        <Link to="/diaspora">
          <button>Explore Diaspora Hub</button>
        </Link>
      </section>

      <section className="section">
  <h2>Latest From Congo Unity</h2>

  <div className="cards">
    <div className="card">
      <h3>Latest Jobs</h3>
      {homeData.jobs.length === 0 ? (
        <p>No jobs yet.</p>
      ) : (
        homeData.jobs.map((job) => (
          <p key={job.id}>
            <strong>{job.title}</strong> — {job.company}
          </p>
        ))
      )}
      <Link to="/jobs">
        <button>View Jobs</button>
      </Link>
    </div>

    <div className="card">
      <h3>Latest Scholarships</h3>
      {homeData.scholarships.length === 0 ? (
        <p>No scholarships yet.</p>
      ) : (
        homeData.scholarships.map((item) => (
          <p key={item.id}>
            <strong>{item.title}</strong> — {item.organization}
          </p>
        ))
      )}
      <Link to="/scholarships">
        <button>View Scholarships</button>
      </Link>
    </div>

    <div className="card">
      <h3>Upcoming Events</h3>
      {homeData.events.length === 0 ? (
        <p>No events yet.</p>
      ) : (
        homeData.events.map((event) => (
          <p key={event.id}>
            <strong>{event.title}</strong> — {event.location}
          </p>
        ))
      )}
      <Link to="/events">
        <button>View Events</button>
      </Link>
    </div>

    <div className="card">
      <h3>Recent Posts</h3>
      {homeData.posts.length === 0 ? (
        <p>No posts yet.</p>
      ) : (
        homeData.posts.map((post) => (
          <p key={post.id}>{post.text?.slice(0, 80)}...</p>
        ))
      )}
      <Link to="/feed">
        <button>View Feed</button>
      </Link>
    </div>

    <div className="card">
      <h3>New Members</h3>
      {homeData.members.length === 0 ? (
        <p>No members yet.</p>
      ) : (
        homeData.members.map((member) => (
          <p key={member.id}>
            <strong>{member.firstName} {member.lastName}</strong> — {member.province}
          </p>
        ))
      )}
      <Link to="/directory">
        <button>View Directory</button>
      </Link>
    </div>
  </div>
</section>

      <section id="join" className="section">
        <h2>Built for Congo</h2>
        <p>
          Together we remember. Together we rise. Together we build the future
          of Congo.
        </p>
      </section>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/account-suspended" element={<AccountSuspended />} />
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:email" element={<PublicProfile />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/profile-picture" element={<ProfilePicture />} />
        <Route path="/uploadid" element={<UploadID />} />
        <Route
          path="/identity"
          element={
            <ProtectedRoute>
              <IdentityDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/identity/documents"
          element={
            <ProtectedRoute>
              <IdentityDocuments />
            </ProtectedRoute>
          }
        />
        <Route path="/verify/:citizenId" element={<VerifyCitizenId />} />

        <Route path="/directory" element={<Directory />} />
        <Route path="/search-users" element={<SearchUsers />} />
        <Route path="/follow" element={<FollowSystem />} />
        <Route path="/followers" element={<FollowersPage />} />
        <Route path="/following" element={<FollowingPage />} />

        <Route path="/feed" element={<CommunityFeed />} />
        <Route path="/messages" element={<Navigate to="/direct-messages" replace />} />
        <Route
          path="/direct-messages"
          element={
            <ProtectedRoute>
              <DirectMessages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />

        <Route path="/report-issue" element={<ReportIssue />} />
        <Route path="/issues" element={<Issues />} />

        <Route path="/diaspora" element={<DiasporaHub />} />
        <Route path="/diaspora-directory" element={<DiasporaDirectory />} />
        <Route path="/east-crisis" element={<EastCrisis />} />
        <Route path="/memory-wall" element={<MemoryWall />} />
        <Route path="/news" element={<CongoNews />} />
        <Route path="/culture" element={<Culture />} />
        <Route path="/osint" element={<OSINTCenter />} />
        <Route path="/take-action" element={<TakeAction />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/create-announcement" element={<CreateAnnouncement />} />

        <Route path="/emergency-alerts" element={<EmergencyAlerts />} />
        <Route path="/crisis-alerts" element={<CrisisAlerts />} />
        <Route path="/emergency-response" element={<EmergencyResponse />} />
        <Route path="/aid-directory" element={<AidDirectory />} />
        <Route path="/partners" element={<Partners />} />

        <Route path="/fundraisers" element={<Fundraisers />} />
        <Route path="/events" element={<Events />} />
        <Route path="/businesses" element={<Businesses />} />
        <Route path="/success-stories" element={<SuccessStories />} />
        <Route path="/volunteer" element={<Volunteer />} />

        <Route path="/jobs" element={<Jobs />} />
        <Route path="/create-job" element={<CreateJob />} />
        <Route path="/scholarships" element={<Scholarships />} />
        <Route path="/create-scholarship" element={<CreateScholarship />} />

        <Route path="/congo-map" element={<CongoMap />} />
        <Route path="/congo-gallery" element={<CongoGallery />} />
        <Route path="/timeline" element={<CongoTimeline />} />
        <Route path="/languages" element={<Languages />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/help" element={<HelpSupport />} />
        <Route path="/hub" element={<DashboardHub />} />
        <Route path="/create-event" element={<CreateEvent />} />
        <Route path="/businesses/:id" element={<BusinessDetails />} />
        <Route path="/scholarships/:id" element={<ScholarshipDetails />} />
        <Route path="/events/:id" element={<EventDetails />} />
        <Route path="/news/:id" element={<NewsDetails />} />

        <Route
          path="/admin"
          element={
            <ProtectedAdmin>
              <AdminDashboard />
            </ProtectedAdmin>
          }
        />

        <Route
          path="/verify-citizens"
          element={
            <ProtectedAdmin>
              <VerifyCitizens />
            </ProtectedAdmin>
          }
        />

        <Route
          path="/admin/gallery"
          element={
            <ProtectedAdmin>
              <AdminGalleryManager />
            </ProtectedAdmin>
          }
        />

        <Route
          path="/admin/users"
          element={
            <ProtectedAdmin>
              <AdminUserManagement />
            </ProtectedAdmin>
          }
        />

        <Route
          path="/admin/verifications"
          element={
            <ProtectedAdmin>
              <AdminVerificationQueue />
            </ProtectedAdmin>
          }
        />

        <Route path="/government-dashboard" element={<GovernmentDashboard />} />
        <Route path="/user-management" element={<UserManagement />} />
        <Route
          path="/admin-cms"
          element={
            <ProtectedAdmin>
              <AdminCMS />
            </ProtectedAdmin>
          }
        />
        <Route path="/create-news" element={<CreateNews />} />
        <Route path="/create-business" element={<CreateBusiness />} />
        <Route path="/global-search" element={<GlobalSearch />} />
        <Route path="/jobs/:id" element={<JobDetails />} />
        <Route
          path="/saved"
          element={
            <ProtectedRoute>
              <SavedItems />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;