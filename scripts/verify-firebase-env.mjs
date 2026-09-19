/**
 * Verifies Firebase env vars and admin SDK init (run on laptop or production server).
 * Usage: node scripts/verify-firebase-env.mjs
 * Loads server/.env from cwd when present.
 */
import dotenv from "dotenv";
import admin from "firebase-admin";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

function fixPrivateKey(key) {
  if (!key) return undefined;
  let fixed = key.trim();
  if (fixed.startsWith('"') && fixed.endsWith('"')) {
    fixed = fixed.slice(1, -1);
  }
  if (!fixed.includes("-----BEGIN PRIVATE KEY-----")) {
    try {
      fixed = Buffer.from(fixed, "base64").toString("utf-8");
    } catch {
      /* keep as-is */
    }
  }
  fixed = fixed.replace(/\\n/g, "\n");
  if (!fixed.includes("\n")) {
    fixed = fixed
      .replace(/-----BEGIN PRIVATE KEY-----/g, "-----BEGIN PRIVATE KEY-----\n")
      .replace(/-----END PRIVATE KEY-----/g, "\n-----END PRIVATE KEY-----\n");
  }
  return fixed;
}

const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY?.trim();

const missing = [];
if (!projectId) missing.push("FIREBASE_PROJECT_ID");
if (!clientEmail) missing.push("FIREBASE_CLIENT_EMAIL");
if (!privateKeyRaw) missing.push("FIREBASE_PRIVATE_KEY");

if (missing.length) {
  console.error("FAIL: missing env:", missing.join(", "));
  process.exit(1);
}

const privateKey = fixPrivateKey(privateKeyRaw);
if (!privateKey?.includes("BEGIN PRIVATE KEY")) {
  console.error("FAIL: FIREBASE_PRIVATE_KEY is not valid PEM after decode.");
  process.exit(1);
}

try {
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }
  console.log("OK: Firebase Admin SDK initialized.");
  console.log(`    project_id=${projectId}`);
  console.log(`    client_email=${clientEmail}`);
  process.exit(0);
} catch (err) {
  console.error("FAIL: Firebase init error:", err instanceof Error ? err.message : err);
  process.exit(1);
}
