import mongoose from "mongoose";

/**
 * Returns true only when `id` is a non-empty string that Mongoose can cast to ObjectId.
 * Guards findById/findOne({ _id }) against undefined, null, "system", phone numbers, etc.
 */
export function isValidObjectId(id: unknown): id is string {
  if (id === undefined || id === null) {
    return false;
  }

  const normalized = String(id).trim();
  if (!normalized) {
    return false;
  }

  return mongoose.Types.ObjectId.isValid(normalized);
}
