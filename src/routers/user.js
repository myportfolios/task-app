const express = require("express");
const multer = require("multer"); //import the multer
const sharp = require("sharp"); //import the sharp
const User = require("../models/user");
const {
  sendWelcomeMessage,
  sendCancellationMsg,
} = require("../emails/accounts");

//import auth middleware to be used on protected routes and pass it in as the second argument b4 the router
const auth = require("../middleware/auth");

//create router. The router has access to all the HTTP methods - CRUD
const router = new express.Router();

/** Users Collection starts************/
/*
 * GET Method - READ
 */

//1. POST Method  - to CREATE a user
router.post("/users", async (req, res) => {
  try {
    //create an instance of model and pass in request body(as in this 'post' case)
    const user = new User(req.body);
    //save to database
    await user.save();
    //if successful, send welcome mail then send back the created user
    sendWelcomeMessage(user.email, user.name);
    //generate token
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (e) {
    //otherwise send back error msg
    //set the status code - res.status() before sending back the error - .send(e)
    res.status(500).send(e);
  }
});

//2. POST Method  - to LOGIN a user
router.post("/users/login", async (req, res) => {
  try {
    //validation already in findByCredentials method
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    //token generation should be on the instance of the user and not on the main User model
    //create a reuable funtion to geneate  auth token
    //send back token after successful login - user will use the token to access protected routes
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (e) {
    res.status(400).send();
  }
});
/**
 * logout a user
 */
router.post("/users/logout", auth, async (req, res) => {
  try {
    //get th earray of tokens and remove the token sent in the request from the list
    req.user.tokens = req.user.tokens.filter(
      (token) => token.token !== req.token
    );
    //save user after removing the token
    await req.user.save();

    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

/**
 * logout all users
 */
router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send();
  }
});
//3. Get the logged in users from db
/*
 * GET Method - READ
 */
router.get("/users/me", auth, async (req, res) => {
  res.send(req.user);
});

//4. find and update a user from db
/**
 * CRUD - UPDATE
 * PATCH - -designed for updating existing resource
 * the third argument is the options object and it contains :
 * 1. key/value - new :true.This will will ensure we get back from the api call the original user with the routerlied updates
 * 2. key/value - runValidators: true. This will ensure that what ever validation that exist is run
 */
router.patch("/users/me", auth, async (req, res) => {
  // const options = { new: true, runValidators: true }
  //validate the request body
  //1. make a list of all the likely properties in the reqBody that can be updated
  const allowedUpdates = ["name", "email", "age", "password"];
  //2. create a list of the properties on the reqBody sent by user for update
  const userUpdates = Object.keys(req.body);
  //3. check if key/property in the request body exist in the allowedUpdates list
  const isRequestValid = userUpdates.every((update) =>
    allowedUpdates.includes(update)
  );
  //4. if not valid return an validation error msg
  if (!isRequestValid) {
    return res.status(400).send({ error: "Invalid updates" });
  }
  try {
    //apply available updates to user based on what update the user puts in the reqBody
    userUpdates.forEach((update) => (req.user[update] = req.body[update]));
    // const user = await User.findByIdAndUpdate(id, reqBody, options) make changes bcos of middleware

    //execute middleware
    await req.user.save();
    res.send(req.user);
  } catch (e) {
    res.status(400).send(e);
  }
});

//5. find and delete a user from db
/**
 * CRUD - DELETE
 */
router.delete("/users/me", auth, async (req, res) => {
  try {
    await req.user.remove();
    //send cancellation message
    sendCancellationMsg(req.user.email, req.user.name);
    res.send(req.user);
  } catch (e) {
    res.status(500).send();
  }
});

//create an instance of multer - middleware
//all configurations for uploads are done in the options object passed into multer instance
const uploadAvatar = multer({
  // dest: "avatars", //multer saves the uploaded avatar in the 'avatar' dir
  //not declaring the 'dest' ppty makes multer pass the return value from 'single()' to the callback function
  //hence, makin gthe file available on the 'res' arg in the callback fn
  limits: {
    //property used to set file size amongst other things
    fileSize: 1000000, //size is in bytes
  },
  fileFilter(req, file, cb) {
    //enables us to filter the file by its type
    // to get more details abt the file to be uploaded, we access the methods on the 'file' arg
    //cb is a callback used to send back error msg whn file is not of the expected type
    //we access the 'originalname' method to check the file type
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      //regex - check if image type is any of the options
      return cb(new Error("Please upload an image")); //send error if not pdf
    }
    cb(undefined, true); //if pdf, call cb with "undefined" value for error and "true" as the second arg
  },
}); //multer creates the folder ('avatars' in this case) automatically when the file is saved

//route for file(avatar) upload
//pass in the return value from the multer middleware 'single' method - uploadAvatar.single('avatar'). it returns 'file.buffer'
// because 'dest' property isn't defined on multer instance, the 'file.buffer' is passed on to the async callback fn and is available on the 'req' parameter
// In this example,'avatar' is the 'key name' multer would look out for from the post call
router.post(
  "/users/me/avatar",
  auth,
  uploadAvatar.single("avatar"),
  async (req, res) => {
    //use sharp to resize and set a file type for the 'file.buffer'
    //the 2 methods needed for these are 'resize' and 'png' to set to png accordingly
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();
    req.user.avatar = buffer; //save the image buffer to the authenticated user model
    await req.user.save(); //save user
    res.send();
  },
  (error, req, res, next) => {
    //callback for error handling, must have all the 4 parameters for multer to know its for error handling
    //returns the error stated in the fileFilter callback as json
    res.status(400).send({ error: error.message });
  }
);

//route to delete avatar
router.delete("/users/me/avatar", auth, async (req, res) => {
  //set the avatar property on authenticated user to 'undefined'
  req.user.avatar = undefined;
  //save the user with the updated changes
  await user.save();
  //once saved successfully, send an empty object - status of 200 is also sent by default to
  res.send();
});

//route to get user avatar by id and return an image instead of buffer
router.get("/users/:id/avatar", async (req, res) => {
  try {
    const id = req.params.id;
    //search db  for user with the id
    const user = await User.findById(id);
    //case if user or user avatar is null
    if (!user || !user.avatar) {
      //throw error
      throw new Error();
    }
    //case if user and avartar exist
    // set response header to define file type to send back
    res.set("Content-Type", "image/png");
    res.send(user.avatar);
  } catch {
    res.status(404).send();
  }
});
//export the  router
module.exports = router;

/**
 * for files with multiple extension - .doc, .docx
 * we can use a regex or the OR operator or a second 'if' statement
 * ***Regex option - check if string ends with any of the provided options in bracket*******
 * if(!file.originalname.match(/\.(doc|docx)$/)){
 *  return cb(throw Error('File type must be Word document))
 * }
 * ***********************OR option*********
 * if(!(file.originalname.endsWith('doc') || file.originalname.endsWith('docx')) {
 *  return cb(throw Error('File type must be Word document))
 * }
 *
 * ***********************several 'if' option*********
 * if(!file.originalname.endsWith('doc') {
 *  return cb(throw Error('File type must be Word document))
 * }
 * if(!file.originalname.endsWith('docx') {
 *  return cb(throw Error('File type must be Word document))
 * }
 */

/******sharp****************/
/**
 * npm package to crop file size and save file in a prticular format
 * sharp is asynchronous
 */
