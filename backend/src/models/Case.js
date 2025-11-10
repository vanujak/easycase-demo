import mongoose from "mongoose";

const caseSchema = new mongoose.Schema(
  {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true, index: true },
    title:    { type: String, required: true },
    number:   { type: Number, required: true },
    status:   { type: String, enum: ["open", "closed"], default: "open",index:true },
    practiceArea: String,
    courtType:  String,
    courtPlace: String,
  },
  { timestamps: true }
);

// optional: prevent duplicate case numbers per user
// caseSchema.index({ userId: 1, number: 1 }, { unique: true, sparse: true });
// Speed up common queries:
caseSchema.index({ userId: 1, createdAt: -1 });
caseSchema.index({ userId: 1, title: 1 });
caseSchema.index({ userId: 1, number: 1 }, { unique: true });
caseSchema.index({ userId: 1, courtType: 1, courtPlace: 1 });


export default mongoose.model("Case", caseSchema);
