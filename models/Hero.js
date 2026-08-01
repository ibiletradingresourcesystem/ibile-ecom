import mongoose from "mongoose";

/**
 * Read-only Hero model — reads from the shared 'heroes' collection
 * managed by the inventory app.
 */
const HeroSchema = new mongoose.Schema({}, { strict: false, collection: "heroes" });

export default mongoose.models.Hero || mongoose.model("Hero", HeroSchema);
