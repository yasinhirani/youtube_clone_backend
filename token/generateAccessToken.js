const jwt = require("jsonwebtoken");

const generateAccessToken = (email) => {
  const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET);
  return token;
};
module.exports = generateAccessToken;
