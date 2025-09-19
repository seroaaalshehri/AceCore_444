const express = require("express");
const cors = require("cors");
const app = express();

const userRoutes = require("./services/user/routes/userRoutes");

app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

// mount user routes
app.use("/api/users", userRoutes);

module.exports = app;
