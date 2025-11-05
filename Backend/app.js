const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config();


require("./middlewares/passportConfig");
const passport = require("passport");

const app = express();


app.use(passport.initialize());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// CORS
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
); 

// Static files
app.use("/storage", express.static(path.join(__dirname, "storage")));

// Routes
const userRoutes  = require("./services/user/routes/userRoutes");
const gamerRoutes = require("./services/gamer/routes/gamerRoutes");
const clubRoutes  = require("./services/club/routes/clubRoutes");
const agoraRoutes = require("./services/agora/routes/agoraRoutes");
const gamerScrims = require("./services/gamer/routes/gamerScrims");
const SearchRoutes = require("./services/Search/routes/SearchRoutes");
const followRoutes = require("./services/follow/routes/followRoutes");
const { getLiveCardsForViewer } = require("./services/twitch/twitchService");



// Mount
app.use("/api/users", userRoutes);
app.use("/api/gamer", gamerRoutes);
app.use("/api/club",  clubRoutes);
app.use("/api/gamer/scrims", gamerScrims);
app.use('/api/Search', SearchRoutes);
app.use('/api/follow', followRoutes);

app.get("/api/home/live-cards", async (req, res) => {
  try {
    const viewerId = String(req.query.viewerId || "");
    if (!viewerId) return res.status(400).json({ ok: false, error: "missing viewerId" });

    const cards = await getLiveCardsForViewer(viewerId);
    res.json({ ok: true, cards });
  } catch (e) {
    console.error("[live-cards]", e);
    res.status(500).json({ ok: false, error: "server_error" });
  }
});


module.exports = app;

