import mongoose from "mongoose";

const HeroSchema = new mongoose.Schema({}, { strict: false, collection: "heros" });

export default mongoose.models.Hero || mongoose.model("Hero", HeroSchema);
