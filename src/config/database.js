import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const dbConnection = async () => {
  try {
    const dbURI = process.env.MONGODB_URI;

    if (!dbURI) {
      throw new Error(
        "CRITICAL: MONGODB_URI is not defined. Please check your environment variables (Render Dashboard -> Environment)."
      );
    }

    await mongoose.connect(dbURI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      // If you use MongoDB < 8 you have to use this:
      //useNewUrlParser:true,
      //useUnifiedTopology:true
    });

    console.log(`MongoDB is connected`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

export default dbConnection;
