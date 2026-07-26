import mongoose from "mongoose";
import { envConfig } from ".";
import dotenv from "dotenv";
import { syncResultIndexes } from "@/modules/results/result.model";

dotenv.config();

const mongodbConnection = async (): Promise<boolean> => {
  const mongoUrl = envConfig.database.mongodb_url?.trim();

  // Safety: avoid calling connect with undefined/null — Atlas rejects invalid URIs immediately.
  if (!mongoUrl) {
    console.error(
      "MONGODB_URL is missing or empty. Skipping database connection."
    );
    return false;
  }

  console.log("Connecting MongoDB Database...");

  try {
    await mongoose.connect(mongoUrl, {
      ssl: true,
      retryWrites: true,
      serverSelectionTimeoutMS: 10000,
    });

    console.log("MongoDB Connected Successfully!");
  } catch (error: any) {
    console.error(`Failed to connect to MongoDB. Error: ${error?.message}`);
    return false;
  }

  // Safety: index sync is best-effort — a failure here must not block server startup.
  try {
    await syncResultIndexes();
  } catch (error: any) {
    console.error(
      `Failed to sync Result indexes (non-fatal). Error: ${error?.message}`
    );
  }

  return true;
};

export default mongodbConnection;
