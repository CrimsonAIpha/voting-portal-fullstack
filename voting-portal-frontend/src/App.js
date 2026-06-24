import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    const response = await fetch("http://localhost:5000/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      // Save user in localStorage
      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } else {
      alert(data.message);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Enter Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <br /><br />
        <input
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <br /><br />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

function Admin() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState(["", "", ""]);
  const [polls, setPolls] = useState([]);

  // ✅ Fetch Dashboard Data
  const fetchDashboard = async () => {
    const response = await fetch("http://localhost:5000/api/admin/dashboard");
    const data = await response.json();
    setPolls(data);
  };

  // ✅ Load dashboard when page opens
 useEffect(() => {
  fetchDashboard();
}, []);

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const handleCreatePoll = async (e) => {
    e.preventDefault();

    const response = await fetch("http://localhost:5000/api/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, options }),
    });

    if (response.ok) {
      alert("Poll Created ✅");
      setTitle("");
      setDescription("");
      setOptions(["", "", ""]);
      fetchDashboard(); // ✅ Refresh results
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Admin Dashboard</h2>

      {/* ✅ CREATE POLL SECTION */}
      <h3>Create Poll</h3>
      <form onSubmit={handleCreatePoll}>
        <input
          type="text"
          placeholder="Poll Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <br /><br />

        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <br /><br />

        <h4>Options:</h4>
        {options.map((opt, index) => (
          <div key={index}>
            <input
              type="text"
              placeholder={`Option ${index + 1}`}
              value={opt}
              onChange={(e) => handleOptionChange(index, e.target.value)}
            />
            <br /><br />
          </div>
        ))}

        <button type="button" onClick={addOption}>
          Add Option
        </button>

        <br /><br />
        <button type="submit">Create Poll</button>
      </form>

      <hr />

      {/* ✅ LIVE RESULTS SECTION */}
      <h3>Live Results</h3>

      {polls.map((poll, index) => (
        <div key={index} style={{ marginBottom: "15px" }}>
          <strong>{poll.title}</strong> <br />
          {poll.option_text} — Votes: {poll.vote_count}
        </div>
      ))}
    </div>
  );
}

function Employee() {
  const [polls, setPolls] = useState([]);
  const user = JSON.parse(localStorage.getItem("user"));

  // ✅ Fetch active polls
  const fetchActivePolls = async () => {
    const response = await fetch(
      `http://localhost:5000/api/polls/active/${user.user_id}`
    );
    const data = await response.json();
    setPolls(data);
  };

  useEffect(() => {
    fetchActivePolls();
  }, []);

  // ✅ Handle Vote
  const handleVote = async (poll_id, option_id) => {
    const response = await fetch("http://localhost:5000/api/votes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: user.user_id,
        poll_id: poll_id,
        option_id: option_id,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      alert("Vote Cast ✅");
      fetchActivePolls(); // ✅ Refresh list (poll disappears)
    } else {
      alert(data.message);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Welcome, {user.name}</h2>

      <h3>Pending Polls</h3>

      {polls.length === 0 && <p>No pending polls ✅</p>}

      {polls.map((poll) => (
        <div
          key={poll.option_id}
          style={{
            border: "1px solid gray",
            padding: "10px",
            marginBottom: "10px",
          }}
        >
          <strong>{poll.title}</strong>
          <p>{poll.description}</p>

          <button
            onClick={() => handleVote(poll.poll_id, poll.option_id)}
          >
            Vote for {poll.option_text}
          </button>
        </div>
      ))}
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/dashboard" element={<Employee />} />
      </Routes>
    </Router>
  );
}

export default App;