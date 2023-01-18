require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const History = require("./schema/HistorySchema");
const generateAccessToken = require("./token/generateAccessToken");

const app = express();

app.use(cors());
app.use(express.json());

const port = process.env.PORT || 8080;
const uri = process.env.MONGODB_CONNECT_URI;

const connectDb = async () => {
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
};

connectDb().then(() => {
  console.log("Connected");
});

const validateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];
  if (!token) {
    return res.status(401).send({ message: "Your are unauthorized" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, data) => {
    if (err) {
      return res.status(403).send({ message: err });
    }
    req.user = data;
    next();
  });
};

// app.get("/api/refreshToken", (req, res) => {
//   const authHeader = req.headers["authorization"];
//   const token = authHeader?.split(" ")[1];
//   if (!token) {
//     return res.status(401).send({ message: "Your are unauthorized" });
//   }
//   jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, data) => {
//     if (err) {
//       return res.status(403).send({ message: "Token is invalid" });
//     }
//     const newAccessToken = generateAccessToken(data.email);
//     res.send({access_token: newAccessToken})
//   });
// });

app.post("/history", validateToken, (req, res) => {
  const history = new History({
    email: req.user.email,
    channelName: req.body.channelName,
    title: req.body.title,
    description: req.body.description,
    thumbnail: req.body.thumbnail,
    time: req.body.time,
    videoId: req.body.videoId,
  });
  history.save().then(() => {
    res.status(201).send({
      success: true,
      message: "History added Successfully",
    });
  });
});

app.get("/getHistoryData", validateToken, async (req, res) => {
  connectDb();
  const history = History;
  history
    .find({ email: req.user.email })
    .sort("-time")
    .exec((err, data) => {
      res.send(data);
    });
});

app.get("/historyAvailable", validateToken, async (req, res) => {
  connectDb();
  const history = History;
  const data = await history.find({
    videoId: req.query.videoId,
    email: req.user.email,
  });
  if (data.length > 0) {
    res.send({ success: true, message: "" });
  } else {
    res.send({ success: false, message: "" });
  }
});

app.post("/deleteHistory", validateToken, async (req, res) => {
  connectDb();
  const history = History;
  const matchUser = await history.find({
    videoId: req.body.videoId,
    email: req.user.email,
  });
  if (matchUser[0]?.email === req.user.email) {
    const data = await history
      .deleteOne({
        videoId: req.body.videoId,
        email: req.user.email,
      })
      .catch(() =>
        res.send({
          success: false,
          message:
            "There was some issue while deleting history, please try after some time",
        })
      );
    if (data.acknowledged) {
      res.send({ success: true, message: "" });
    }
  } else {
    res.status(403).send({
      success: false,
      message: "Not allowed to delete other's history",
    });
  }
});

app.post("/updateTime", validateToken, async (req, res) => {
  connectDb();
  const history = History;
  const data = await history.updateOne(
    { videoId: req.body.videoId, email: req.user.email },
    { time: req.body.time }
  );
  if (data.acknowledged) {
    res.send({ success: true, message: "" });
  }
});

app.listen(port);
