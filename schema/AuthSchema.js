const mongoose = require("mongoose");

const authSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
  },
  password: {
    type: String,
  },
});

module.exports = mongoose.model("users", authSchema);
