const jwt = require("jsonwebtoken");

const generateRefreshToken = (email) => {
  const token = jwt.sign({ email: email }, process.env.REFRESH_TOKEN_SECRET);
  return token;
};
module.exports = generateRefreshToken;
