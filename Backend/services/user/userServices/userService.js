const { db } = require("../../../Firebase/firebaseBackend");
const collection = db.collection("users");

// Create
exports.createUser = async (data) => {
  console.log("👉 Creating user with data:", data);
  try {
    const docRef = await collection.add(data);
    console.log("✅ User created with ID:", docRef.id);
    return { id: docRef.id, ...data };
  } catch (err) {
    console.error("🔥 Firestore error while creating user:", err);
    throw err; // rethrow so controller also knows
  }
};


// Read (by ID)
exports.getUser = async (id) => {
  const doc = await collection.doc(id).get();
  if (!doc.exists) throw new Error("User not found");
  return { id: doc.id, ...doc.data() };
};

// Read All
exports.getAllUsers = async () => {
  const snapshot = await collection.get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// Update
exports.updateUser = async (id, data) => {
  await collection.doc(id).update(data);
  const updated = await collection.doc(id).get();
  return { id: updated.id, ...updated.data() };
};

// Delete
exports.deleteUser = async (id) => {
  await collection.doc(id).delete();
  return { message: `User ${id} deleted successfully` };
};
