//require the jwt library
const jwt = require("jsonwebtoken");
//require the User model
const User = require("../models/user");

//create middleware
const auth = async (req, res, next) => {
  try {
    //get authorization token from request header
    //the header method takes in the name of the authorization type
    //remove the  word 'Bearer; from the token
    const token = req.header("Authorization").replace("Bearer ", "");
    //verify the token using the secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    //get the verified user from the db using id in the decoded token
    const user = await User.findOne({
      _id: decoded._id,
      "tokens.token": token,
    });
    //check if user doesn't exist. This will trigger the catch case
    if (!user) {
      throw new error();
    }
    //proceed to router if user exist
    //add token to req body. This is needed for for logging out
    req.token = token;
    //add user to req body. This is needed for returning the profile of the logged in user
    req.user = user;
    next();
  } catch (e) {
    res.status(401).send({ error: "Please authenticate." });
  }
};
module.exports = auth;
