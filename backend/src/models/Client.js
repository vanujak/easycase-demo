import mongoose from "mongoose";
import { SRI_LANKA_DISTRICTS } from "../constants/districts.js";

const clientSchema = new mongoose.Schema(
  {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // Keep values simple/lowercase
    type:     { type: String, enum: ["individual", "company", "government", "organization"], default: "individual", index: true },

    name:     { type: String, required: true },
    email:    String,
    phone:    String,
    emailLower: String,

    // address is free text
    address:  { type: String, default: "" },

    // district is constrained to Sri Lanka list
    district: { type: String, enum: SRI_LANKA_DISTRICTS, default: "" },
  },
  { timestamps: true }
);

clientSchema.index({ userId: 1, emailLower: 1 }, { unique: true, sparse: true });

export default mongoose.model("Client", clientSchema);
