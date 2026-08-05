import mongoose from "mongoose";

const SiteSocialLinkSchema = new mongoose.Schema({}, { strict: false, collection: "sitesociallinks" });

export default mongoose.models.SiteSocialLink || mongoose.model("SiteSocialLink", SiteSocialLinkSchema);
