const mongoose = require("mongoose");
const { USER_ROLES } = require("../constants/roles");

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, maxlength: 50 },
    city: { type: String, trim: true, required: true },
    street: { type: String, trim: true, required: true },
    building: { type: String, trim: true },
    apartment: { type: String, trim: true },
    notes: { type: String, trim: true, maxlength: 500 }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    phone: { type: String, required: true, trim: true, minlength: 7, maxlength: 20 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8 },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.CUSTOMER
    },
    addresses: { type: [addressSchema], default: [] },
    isActive: { type: Boolean, default: true },
    passwordResetTokenHash: { type: String, default: null },
    passwordResetExpires: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
