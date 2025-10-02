const express = require("express");
const cors = require("cors");
const path = require("path");
require("./middlewares/passportConfig");
const app = express();
const passport = require("passport");


// Initialize Passport (must come after config)
app.use(passport.initialize());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS config — allow frontend to communicate with backend
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Routes
const userRoutes = require("./services/user/routes/userRoutes");
const gamerRoutes = require("./services/gamer/routes/gamerRoutes");
const clubRoutes = require("./services/club/routes/clubRoutes");


// Static files
app.use("/storage", express.static(path.join(__dirname, "storage")));


app.use("/api/users", userRoutes);
app.use("/api/gamer", gamerRoutes); 
app.use("/api/club", clubRoutes);  
module.exports = app;