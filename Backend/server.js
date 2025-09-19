// server.js
const app = require("./app");   // import Express app
const PORT = process.env.PORT || 4000;  // fixed port or from env

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
