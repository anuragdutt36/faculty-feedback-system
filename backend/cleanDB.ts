import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

async function clean() {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    console.log("URI:", uri);
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");

    const db = mongoose.connection.db;

    const collectionsToClear = [
      "studentprofiles",
      "feedbacksessions",
      "feedbackresponses",
      "submissionstatuses",
      "notifications",
      "auditlogs",
      "rollmappings"
    ];

    for (const collName of collectionsToClear) {
      try {
        const coll = db.collection(collName);
        const result = await coll.deleteMany({});
        console.log(`Deleted ${result.deletedCount} documents from ${collName}`);
      } catch (err) {
        console.log(`Could not clear ${collName}:`, err.message);
      }
    }

    // Delete student users
    const usersColl = db.collection("users");
    const result = await usersColl.deleteMany({ role: "student" });
    console.log(`Deleted ${result.deletedCount} student users from users`);

    console.log("Cleanup complete!");
    process.exit(0);
  } catch (err) {
    console.error("Error during cleanup:", err);
    process.exit(1);
  }
}

clean();
