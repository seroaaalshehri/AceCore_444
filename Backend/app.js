const express = require("express");
const cors = require("cors");
const path = require("path"); 
const app = express();

const userRoutes = require("./services/user/routes/userRoutes");
const gamerRoutes = require("./services/gamer/routes/gamerRoutes");
const clubRoutes = require("./services/club/routes/clubRoutes");

app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());


app.use("/api/users", userRoutes);
app.use("/storage", express.static(path.join(__dirname, "storage")));
app.use("/api/gamer", gamerRoutes);
app.use("/api/club", clubRoutes);


module.exports = app;
