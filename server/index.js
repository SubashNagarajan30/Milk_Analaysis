require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { db } = require("./firebase");
const { seedDatabase } = require("./dbSeeder");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Seed the database if collections are empty
seedDatabase();

// --- API ROUTES ---

// Login authentication
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }
  try {
    const usersSnap = await db.collection("users").get();
    let foundUser = null;
    usersSnap.forEach(doc => {
      const u = doc.data();
      if (u.username === username && u.password === password) {
        foundUser = u;
      }
    });

    if (foundUser) {
      // Don't return password if we want security, but for our simple react client-side check fallback we can include it
      res.json(foundUser);
    } else {
      res.status(401).json({ error: "Invalid username or password" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all users
app.get("/api/users", async (req, res) => {
  try {
    const snapshot = await db.collection("users").get();
    const users = [];
    snapshot.forEach(doc => users.push(doc.data()));
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user credentials
app.put("/api/users/:id/credentials", async (req, res) => {
  const { id } = req.params;
  const { username, password } = req.body;
  try {
    const userRef = db.collection("users").doc(id);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const update = {};
    if (username && username.trim() !== '') update.username = username.trim();
    if (password && password.trim() !== '') update.password = password.trim();

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    await userRef.update(update);
    const updatedDoc = await userRef.get();
    res.json(updatedDoc.data());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all hubs
app.get("/api/hubs", async (req, res) => {
  try {
    const snapshot = await db.collection("hubs").get();
    const hubs = [];
    snapshot.forEach(doc => hubs.push(doc.data()));
    res.json(hubs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new hub and its associated user
app.post("/api/hubs", async (req, res) => {
  const { name, parentId } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Hub name is required" });
  }
  try {
    const hubId = `hub-${Date.now()}`;
    const newHub = { id: hubId, name, parentId: parentId || null };
    
    const userId = `user-${Date.now()}`;
    const newUser = {
      id: userId,
      name: `${name} Incharge`,
      username: `${name.toLowerCase().replace(/\s+/g, ".")}.incharge`,
      password: "password",
      role: "Hub Incharge",
      hubId: hubId
    };

    await db.collection("hubs").doc(hubId).set(newHub);
    await db.collection("users").doc(userId).set(newUser);

    res.status(201).json({ hub: newHub, user: newUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all daily records
app.get("/api/records", async (req, res) => {
  try {
    const snapshot = await db.collection("records").get();
    const records = [];
    snapshot.forEach(doc => records.push(doc.data()));
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add/update a daily record (morning/evening collection values)
app.post("/api/records", async (req, res) => {
  const { hubId, date, morning, evening } = req.body;
  if (!hubId || !date || !morning || !evening) {
    return res.status(400).json({ error: "Missing required fields: hubId, date, morning, evening" });
  }
  try {
    const id = `record-${hubId}-${date}`;
    const record = { id, hubId, date, morning, evening };
    await db.collection("records").doc(id).set(record);
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add/update a retest record
app.put("/api/records/:id/retest", async (req, res) => {
  const { id } = req.params;
  const { session, retestData } = req.body;
  if (!session || !retestData) {
    return res.status(400).json({ error: "session ('morning'|'evening') and retestData are required" });
  }
  try {
    const docRef = db.collection("records").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Record not found" });
    }
    
    const update = {};
    if (session === "morning") {
      update.morningReTest = retestData;
    } else if (session === "evening") {
      update.eveningReTest = retestData;
    } else {
      return res.status(400).json({ error: "Invalid session type. Must be 'morning' or 'evening'" });
    }

    await docRef.update(update);
    const updatedDoc = await docRef.get();
    res.json(updatedDoc.data());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all tanker retests
app.get("/api/tankers", async (req, res) => {
  try {
    const snapshot = await db.collection("tankers").get();
    const tankers = [];
    snapshot.forEach(doc => tankers.push(doc.data()));
    res.json(tankers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add/update a tanker retest
app.post("/api/tankers", async (req, res) => {
  const { hubId, date, quantity, fat, snf } = req.body;
  if (!hubId || !date || quantity === undefined || fat === undefined || snf === undefined) {
    return res.status(400).json({ error: "Missing required fields: hubId, date, quantity, fat, snf" });
  }
  try {
    const id = `tanker-${hubId}-${date}`;
    const tanker = { id, hubId, date, quantity: parseFloat(quantity), fat: parseFloat(fat), snf: parseFloat(snf) };
    await db.collection("tankers").doc(id).set(tanker);
    res.status(201).json(tanker);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Express server running on port ${PORT}`);
});
