const jwt = require("jsonwebtoken");
const config = require("../config/auth.config");

module.exports.verifyToken = function (req) {
    try {
        let token = req.headers["x-access-token"];
        let response = {
            msg: "",
            userId: "",
            userType: ""
        };
        if (!token) {
            response.msg = "Authentication Token Missing";
            return response;
        }

        jwt.verify(token, config.secret.toString('utf-8'), (err, decoded) => {
            if (err) {
                response.msg = "Token Mismatch";
                return response;
            }
            response.userId = decoded.id;
            response.userType = decoded.userType;
        });
        return response;
    } catch (err) {
        return res.json({ status: false, message: "Unauthorized!" });
    }
};

module.exports.webStasignToken = (userId, secretKey, expiresToken) =>
new Promise((resolve, reject) => {
  const payload = { userID: userId };
  const secret = secretKey;
  const options = {
    expiresIn: expiresToken,
  };
  jwt.sign(payload, secret, options, (err, token) => {
    if (err) {
      reject(err);
      return;
    }
    resolve(token);
  });
});

module.exports.webStaverifyToken = (token, secretKey) =>
new Promise((resolve, reject) => {
  jwt.verify(token, secretKey, (err, payload) => {
    if (err) return reject(err);

    return resolve(payload);
  });
});