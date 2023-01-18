require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const History = require("./schema/HistorySchema");
const Auth = require("./schema/AuthSchema");
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

// Auth APIs
app.post("/api/register", async (req, res) => {
  const { email, password } = req.body;
  const hashPassword = await bcrypt.hash(password, 10).then((hash) => hash);
  const authRegister = new Auth({ email: email, password: hashPassword });
  authRegister
    .save()
    .then(() => {
      res.status(201).send({
        success: true,
        message: "Registered successfully, please login to continue",
      });
    })
    .catch((err) => {
      if (err.code === 11000) {
        res.send({ success: false, message: "Email address already exists" });
      } else {
        res.send({
          success: false,
          message:
            "There was a issue while registering you, please try after some time",
        });
      }
    });
});

app.post("/api/login", async (req, res) => {
  connectDb();
  const user = Auth;
  const isAvailable = await user.find({ email: req.body.email });
  if (isAvailable.length > 0) {
    const match = await bcrypt.compare(
      req.body.password,
      isAvailable[0].password
    );
    if (match) {
      res.status(200).send({
        success: true,
        message: "Login successful",
        access_token: generateAccessToken(req.body.email),
        authData: { email: isAvailable[0].email },
      });
    } else {
      res.status(200).send({ success: false, message: "Invalid Credentials" });
    }
  } else {
    res.status(200).send({ success: false, message: "User not found" });
  }
});

// Youtube clone history APIs

app.post("/api/history", validateToken, (req, res) => {
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

app.get("/api/getHistoryData", validateToken, async (req, res) => {
  connectDb();
  const history = History;
  history
    .find({ email: req.user.email })
    .sort("-time")
    .exec((err, data) => {
      res.send(data);
    });
});

app.get("/api/historyAvailable", validateToken, async (req, res) => {
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

app.post("/api/deleteHistory", validateToken, async (req, res) => {
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

app.post("/api/updateTime", validateToken, async (req, res) => {
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
