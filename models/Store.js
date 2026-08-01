import mongoose from "mongoose";

/**
 * Read-only Store model — references the same collection as the inventory app.
 * Uses strict: false so it reads whatever fields exist without needing a full schema copy.
 */
const StoreSchema = new mongoose.Schema({}, { strict: false, collection: "stores" });

export default mongoose.models.Store || mongoose.model("Store", StoreSchema);
