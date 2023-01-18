require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Auth = require("./schema/AuthSchema");
const generateAccessToken = require("./token/generateAccessToken");

const app = express();

const port = 8181 || process.env.PORT;
const uri = process.env.MONGODB_CONNECT_URI;

app.use(cors());
app.use(express.json());

const connectDb = async () => {
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
};

connectDb().then(() => {
  console.log("connected");
});

const validateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];
  if (!token) {
    return res.status(401).send({ message: "Unauthorized" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, data) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden" });
    }
    req.user = data;
    next();
  });
};

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

app.listen(port);
