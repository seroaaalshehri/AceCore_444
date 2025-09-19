const admin = require("firebase-admin");
require("dotenv").config();

// Initialize Firebase Admin

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}


const db = admin.firestore();
const auth = admin.auth();

module.exports = { db, auth };

// 🔥 Debug test (only when running this file directly)
if (require.main === module) {
  (async () => {
    try {
      const snapshot = await db.collection("users").limit(1).get();
      console.log("🔥 Firestore connected. Docs count:", snapshot.size);
    } catch (err) {
      console.error("❌ Firestore connection failed:", err);
    }
  })();
}
console.log("Connected to Firebase project:", process.env.FIREBASE_PROJECT_ID);