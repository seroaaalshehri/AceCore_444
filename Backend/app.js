// Backend/app.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config();

require("./middlewares/passportConfig");
const passport = require("passport");

const app = express();

// Initialize Passport
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

// Mount
app.use("/api/users", userRoutes);
app.use("/api/gamer", gamerRoutes);
app.use("/api/club",  clubRoutes);
app.use("/api/agora", agoraRoutes);

module.exports = app;
