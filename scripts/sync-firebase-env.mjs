/**
 * Reads gitignored firebase-service-account.json and prints .env lines for Firebase.
 * Usage: node scripts/sync-firebase-env.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const jsonPath = path.join(__dirname, "..", "firebase-service-account.json");

if (!fs.existsSync(jsonPath)) {
  console.error("Missing firebase-service-account.json in server/ (gitignored).");
  process.exit(1);
}

const sa = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
const b64Key = Buffer.from(sa.private_key, "utf8").toString("base64");

console.log(`FIREBASE_TYPE=${sa.type ?? "service_account"}`);
console.log(`FIREBASE_PROJECT_ID=${sa.project_id}`);
console.log(`FIREBASE_PRIVATE_KEY_ID=${sa.private_key_id}`);
console.log(`FIREBASE_PRIVATE_KEY=${b64Key}`);
console.log(`FIREBASE_CLIENT_EMAIL=${sa.client_email}`);
console.log(`FIREBASE_CLIENT_ID=${sa.client_id}`);
console.log(`FIREBASE_CLIENT_X509_CERT_URL=${sa.client_x509_cert_url}`);
