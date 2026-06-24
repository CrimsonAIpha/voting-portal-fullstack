const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// MySQL Connection
const db = mysql.createConnection({
  host: "localhost",
  user: "cdac",
  password: "cdac",  // <-- change this
  database: "voting_portal"
});

db.connect((err) => {
  if (err) {
    console.log("Database connection failed:", err);
  } else {
    console.log("Connected to MySQL ✅");
  }
});

// Test route
app.get("/", (req, res) => {
  res.send("Voting Portal Backend Running ✅");
});

// LOGIN API
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT user_id, name, role FROM users WHERE email = ? AND password = ?";
  
  db.query(sql, [email, password], (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }

    if (result.length > 0) {
      res.json({
        message: "Login successful ✅",
        user: result[0]
      });
    } else {
      res.status(401).json({ message: "Invalid email or password ❌" });
    }
  });
});

// CREATE POLL (Admin)
app.post("/api/polls", (req, res) => {
  const { title, description, options } = req.body;

  if (!title || !options || options.length < 2) {
    return res.status(400).json({ message: "Title and at least 2 options required" });
  }

  // Step 1: Insert into polls table
  const pollSql = "INSERT INTO polls (title, description) VALUES (?, ?)";

  db.query(pollSql, [title, description], (err, pollResult) => {
    if (err) {
      return res.status(500).json({ error: "Error creating poll" });
    }

    const poll_id = pollResult.insertId;

    // Step 2: Insert options
    const optionSql = "INSERT INTO options (poll_id, option_text) VALUES ?";

    const optionValues = options.map(option => [poll_id, option]);

    db.query(optionSql, [optionValues], (err, optionResult) => {
      if (err) {
        return res.status(500).json({ error: "Error adding options" });
      }

      res.json({
        message: "Poll created successfully ✅",
        poll_id: poll_id
      });
    });
  });
});

// ADMIN DASHBOARD - View Poll Results
app.get("/api/admin/dashboard", (req, res) => {

  const sql = `
    SELECT 
      p.poll_id,
      p.title,
      p.description,
      o.option_id,
      o.option_text,
      COUNT(v.vote_id) AS vote_count
    FROM polls p
    LEFT JOIN options o ON p.poll_id = o.poll_id
    LEFT JOIN votes v ON o.option_id = v.option_id
    GROUP BY p.poll_id, o.option_id
    ORDER BY p.poll_id DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Error fetching dashboard data" });
    }

    res.json(results);
  });
});

// GET ACTIVE POLLS FOR EMPLOYEE (not yet voted)
app.get("/api/polls/active/:user_id", (req, res) => {

  const user_id = req.params.user_id;

  const sql = `
    SELECT p.poll_id, p.title, p.description,
           o.option_id, o.option_text
    FROM polls p
    JOIN options o ON p.poll_id = o.poll_id
    WHERE p.poll_id NOT IN (
        SELECT poll_id FROM votes WHERE user_id = ?
    )
    ORDER BY p.poll_id DESC
  `;

  db.query(sql, [user_id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Error fetching active polls" });
    }

    res.json(results);
  });
});


// CAST VOTE
app.post("/api/votes", (req, res) => {

  const { user_id, poll_id, option_id } = req.body;

  const sql = "INSERT INTO votes (user_id, poll_id, option_id) VALUES (?, ?, ?)";

  db.query(sql, [user_id, poll_id, option_id], (err, result) => {

    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({ message: "You have already voted in this poll ❌" });
      }
      return res.status(500).json({ error: "Error casting vote" });
    }

    res.json({ message: "Vote cast successfully ✅" });
  });
});



app.listen(5000, () => {
  console.log("Server running on port 5000 ✅");
});