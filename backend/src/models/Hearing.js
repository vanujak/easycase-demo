// backend/src/models/Hearing.js
import mongoose from "mongoose";
const { Schema } = mongoose;

export const OUTCOMES = ["Adjourned", "Continued", "Judgment", "Settled", "Other"];

const hearingSchema = new Schema(
  {
    userId:  { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    caseId:  { type: Schema.Types.ObjectId, ref: "Case", required: true, index: true },
    date:    { type: Date, required: true, index: true },
    notes:   { type: String, maxlength: 1000 },
    outcome: { type: String, enum: OUTCOMES, required: true },
    nextDate:{ type: Date },
  },
  { timestamps: true }
);

hearingSchema.index({ userId: 1, caseId: 1, date: 1 });

export default mongoose.model("Hearing", hearingSchema);
