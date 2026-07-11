import mongoose from "mongoose";
import { envConfig } from ".";
import dotenv from "dotenv";
import { syncResultIndexes } from "@/modules/results/result.model";

dotenv.config();

const mongodbConnection = async (): Promise<void> => {
  console.log("Connecting MongoDB Database...");
  try {
    await mongoose.connect(envConfig.database.mongodb_url, {
      ssl: true,
      retryWrites: true,
      serverSelectionTimeoutMS: 10000,
    });

    await syncResultIndexes();

    console.log("MongoDB Connected Successfully!");
  } catch (error: any) {
    console.error(`Failed to connect to MongoDB. Error: ${error?.message}`);
  }
};

export default mongodbConnection;
