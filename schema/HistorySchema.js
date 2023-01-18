const mongoose = require("mongoose");

const historySchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Email address is required"]
  },
  channelName: {
    type: String,
    required: [true, "Channel Name missing"],
  },
  title: {
    type: String,
    required: [true, "Title missing"],
  },
  thumbnail: {
    type: String,
  },
  time: {
    type: String,
  },
  description: {
    type: String,
  },
  videoId: {
    type: String,
    required: [true, "Video Id missing"],
  },
});

module.exports = mongoose.model("History", historySchema);
