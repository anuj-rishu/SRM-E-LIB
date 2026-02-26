require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const path = require("path");
const YouTubeSearch = require("youtube-search-api");

const app = express();
app.use(express.json());
// CORS - allow all origins (including different ports)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  // Handle preflight
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Serve static files (UI)
app.use(express.static(path.join(__dirname, "public")));

/* ===========================
   YOUTUBE SEARCH (no auth needed)
=========================== */
app.get("/youtube-search", async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: "Missing query" });

  try {
    const results = await YouTubeSearch.GetListByKeyword(query, false, 1);
    if (results && results.items && results.items.length > 0) {
      const video = results.items[0];
      res.json({ 
        videoId: video.id,
        title: video.title,
        thumbnail: video.thumbnail?.thumbnails?.[0]?.url
      });
    } else {
      res.status(404).json({ error: "No videos found" });
    }
  } catch (err) {
    console.error("YouTube search error:", err);
    res.status(500).json({ error: "Search failed" });
  }
});

/* ===========================
   DB CONNECTION
=========================== */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

/* ===========================
   JWT AUTH
=========================== */
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "Token missing" });

  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      registrationNumber: decoded.registrationNumber,
      jsessionid: decoded.jsessionid
    };
    next();
  } catch {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
}

/* ===========================
   MODELS
=========================== */
const userSchema = new mongoose.Schema({
  registrationNumber: { type: String, unique: true },
  jsessionid: String
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

const songSchema = new mongoose.Schema({
  title: String,
  platform: {
    type: String,
    enum: ["youtube", "youtube_music", "spotify"]
  },
  songUrl: String,

  addedBy: {
    registrationNumber: String
  },

  likes: { type: Number, default: 0 },
  plays: { type: Number, default: 0 },
  likedBy: [String],

  rankScore: { type: Number, default: 0 }
}, { timestamps: true });

const Song = mongoose.model("Song", songSchema);

/* ===========================
   RANK CALCULATION
=========================== */
function calculateRank(song) {
  const createdAt = song.createdAt || new Date();
  const hours = (Date.now() - new Date(createdAt).getTime()) / 36e5;

  const freshnessBoost = Math.max(0, 72 - hours);

  return (song.likes * 5) + (song.plays || 0) + freshnessBoost;
}

/* ===========================
   AUTO CREATE USER
=========================== */
async function ensureUser(req, res, next) {
  const { registrationNumber, jsessionid } = req.user;
  const exists = await User.findOne({ registrationNumber });
  if (!exists) {
    await User.create({ registrationNumber, jsessionid });
  }
  next();
}

/* ===========================
   GLOBAL AUTH (only for /api routes)
=========================== */
app.use("/api", auth, ensureUser);

/* ===========================
   ROUTES
=========================== */

/* Add Song */
// Helper: resolve title from URL (YouTube oEmbed, Spotify oEmbed, fallback to youtube search)
async function resolveTitleFromUrl(songUrl) {
  try {
    // YouTube direct (oEmbed)
    const ytRegex = /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const ytMatch = songUrl.match(ytRegex);
    if (ytMatch) {
      const videoId = ytMatch[1];
      try {
        const r = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
        if (r.ok) {
          const data = await r.json();
          if (data && data.title) return data.title;
        }
      } catch (e) {}
    }

    // YouTube Music (v= param)
    try {
      const u = new URL(songUrl);
      const v = u.searchParams.get('v');
      if (v) {
        const r = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${v}&format=json`);
        if (r.ok) {
          const data = await r.json();
          if (data && data.title) return data.title;
        }
      }
    } catch (e) {}

    // Spotify oEmbed
    if (songUrl.includes('spotify.com')) {
      try {
        const r = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(songUrl)}`);
        if (r.ok) {
          const data = await r.json();
          if (data && data.title) return data.title;
        }
      } catch (e) {}
    }

    // Fallback: derive a query from URL path or use the whole URL as query
    let query = '';
    try {
      const u = new URL(songUrl);
      const last = u.pathname.split('/').filter(Boolean).pop() || '';
      query = last.replace(/[-_]/g, ' ');
    } catch (e) {
      query = songUrl;
    }

    if (!query) query = songUrl;

    try {
      const results = await YouTubeSearch.GetListByKeyword(query, false, 1);
      if (results && results.items && results.items.length > 0) {
        const video = results.items[0];
        if (video && video.title) return video.title;
      }
    } catch (e) {
      console.error('Search fallback failed', e);
    }

    return null;
  } catch (err) {
    console.error('resolveTitleFromUrl error', err);
    return null;
  }
}

// Detect platform from URL
function detectPlatformFromUrl(songUrl) {
  try {
    if (!songUrl) return 'youtube';
    const lower = songUrl.toLowerCase();
    if (lower.includes('spotify.com')) return 'spotify';
    if (lower.includes('music.youtube.com')) return 'youtube_music';
    const ytRegex = /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    if (ytRegex.test(songUrl)) return 'youtube';
    return 'youtube';
  } catch (e) {
    return 'youtube';
  }
}

app.post("/api/songs", async (req, res) => {
  const { songUrl } = req.body;
  if (!songUrl) return res.status(400).json({ message: "Missing field: songUrl required" });

  // auto-detect platform
  const platform = detectPlatformFromUrl(songUrl);

  let title = await resolveTitleFromUrl(songUrl);
  if (!title) title = 'Untitled';

  const song = new Song({
    title,
    songUrl,
    platform,
    addedBy: { registrationNumber: req.user.registrationNumber }
  });

  song.rankScore = calculateRank(song);
  await song.save();

  res.json(song);
});

/* Like Song */
app.post("/api/songs/:id/like", async (req, res) => {
  const song = await Song.findById(req.params.id);
  if (!song) return res.status(404).json({ message: "Song not found" });

  if (song.likedBy.includes(req.user.registrationNumber))
    return res.status(400).json({ message: "Already liked" });

  song.likes++;
  song.likedBy.push(req.user.registrationNumber);
  song.rankScore = calculateRank(song);

  await song.save();
  res.json({ likes: song.likes, rankScore: song.rankScore });
});

/* Play Song */
app.post("/api/songs/:id/play", async (req, res) => {
  const song = await Song.findById(req.params.id);
  if (!song) return res.status(404).json({ message: "Song not found" });

  song.plays++;
  song.rankScore = calculateRank(song);
  await song.save();

  res.json({ plays: song.plays, rankScore: song.rankScore });
});

/* Delete Song */
app.delete("/api/songs/:id", async (req, res) => {
  const song = await Song.findById(req.params.id);
  if (!song) return res.status(404).json({ message: "Song not found" });

  if (song.addedBy.registrationNumber !== req.user.registrationNumber)
    return res.status(403).json({ message: "Not allowed" });

  await song.deleteOne();
  res.json({ message: "Song deleted" });
});

/* Ranked Songs */
app.get("/api/songs/ranked", async (req, res) => {
  const songs = await Song.find().sort({ rankScore: -1 });
  res.json(songs);
});

/* My Songs */
app.get("/api/my-songs", async (req, res) => {
  const songs = await Song.find({
    "addedBy.registrationNumber": req.user.registrationNumber
  }).sort({ rankScore: -1 });

  res.json(songs);
});

/* ===========================
   SERVER START
=========================== */
const PORT = process.env.PORT || 9003;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
