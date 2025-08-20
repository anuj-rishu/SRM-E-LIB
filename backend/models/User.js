const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  regNumber: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  photoBase64: String,
  program: String,
  semester: Number,
  department: String,
  section: String,
  mobile: String,
  year: Number,
  points: {
    type: Number,
    default: 100,
  },
  advisors: [
    {
      name: String,
      role: String,
      email: String,
      phone: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  favorites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
    },
  ],

  lastLogin: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", userSchema);
