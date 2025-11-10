import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Sri Lankan mobile: 07XXXXXXXX or +947XXXXXXXX (70/71/72/75/76/77/78)
const sriLankaMobile = /^(?:\+94|0)7(?:0|1|2|5|6|7|8)\d{7}$/;

const userSchema = new mongoose.Schema(
  {
    name:      { type: String, required: true, trim: true },
    email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
    mobile:    { type: String, required: true, match: sriLankaMobile },
    dob:       { type: Date, required: true },
    gender:    { type: String, enum: ["Male", "Female", "Other", "Prefer not to say"], required: true },
    barRegNo:  { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true }, // store HASH, not plain password
    isActive:  { type: Boolean, default: true }
  },
  { timestamps: true }
);


// helper methods
userSchema.methods.setPassword = async function (plain) {
  this.passwordHash = await bcrypt.hash(plain, 10);
};
userSchema.methods.verifyPassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

export default mongoose.model("User", userSchema); // collection: users
