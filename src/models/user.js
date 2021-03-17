const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");

//require Task so as to delete all task when the user is removed
const Task = require("./task.js");

//require bcryptjs
const bcrypt = require("bcryptjs");

//mongoose.model() takes in 2 arguments 1) The string name for the model 2) the definition object that defines all the fields we want
// we uae bcryptjs to hash our password before it is saved. to achieve this we need to modify the model to use Schema(this allows us to take advantage of a middleware)
// The methods  'pre' and 'post' on Schema allows us to do some actions before or after a save call is made

//create user schema
//1. call the mongoose method on mongoose with the 'new' keyword.
//2. pass into the method the object definition or structure of the model as the only argument
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true, //removes spaces tw strings
    },
    email: {
      type: String,
      required: true,
      unique: true, //this will validate duplicate emails
      trim: true,
      lowercase: true,
      validate(email) {
        if (!validator.isEmail(email)) {
          throw new Error("Email is invalid!");
        }
      },
    },
    age: {
      type: Number,
      default: 0,
      validate(value) {
        if (value < 0) {
          throw new Error("Age must be a positive number");
        }
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      // minLength:7, use this or the custom validator below
      validate(value) {
        if (!(value.length > 6)) {
          throw new Error(
            `Path 'password' ('${value}') is shorter than the minimum allowed length (7)`
          );
        }
        if (value.toLowerCase().includes("password")) {
          throw new Error("Path 'password' must not contain 'password");
        }
      },
    },
    avatar: {
      type: Buffer,
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);
//set up a virtual property - a relationship btw 2 entities.
//it's not stored in the db
//create a relationship between the Task collection and the Users collection
userSchema.virtual("tasks", {
  ref: "Task",
  localField: "_id", //where the local data is stored
  foreignField: "owner", //the nam eof the field on the other entity
});
//create a function to return the user instance without the token and password
//using toJSON help authomate the process of calling the function to  delete the pswrd and tokens
//toJSON gets called everytime the data gets stringified - converted to a json string
userSchema.methods.toJSON = function () {
  const user = this;
  //convert the user instance to object
  const userObject = user.toObject();
  //delete the password and token from the object
  delete userObject.tokens;
  delete userObject.password;
  //delete the avatar from the user object as it's heavy and would slow down response
  delete userObject.avatar;
  //return the user
  return userObject;
};
//access the method off the user instance
/**
 * methods() are accessible on the instances of the model(sometimes called instance methods )
 */
userSchema.methods.generateAuthToken = async function () {
  const secret = process.env.JWT_SECRET;
  //jwt expects a string id
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, secret);
  //add the generated token to the user instance
  user.tokens = user.tokens.concat({ token });
  //save to db
  await user.save();
  return token;
};
/**
The use of a schema instead of passing in an object to the model enables us to create custom 
methods/functions on the User model object
statics method are accessible on the model (sometimes called model methods)
 */

userSchema.statics.findByCredentials = async (email, password) => {
  //find user by filter arg/parameter
  const user = await User.findOne({ email });
  //throw error if user doesn't exist
  if (!user) {
    throw new Error("Unable to login");
  }
  //if user exist check if the passwords match
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Unable to login");
  }
  return user;
};

//we use a method on userSchema to setup the middleware. we use the 'save' middleware to run some code b4 the user is saved
//There are 2 methods accessible to us for middleware - 'pre' and 'post' to do something b4 (validation or saving) and after (say after saving) an event respectively
//in this case we use 'pre' and it takes in 2 arguments - (1) name of the event (2) a standard call back function to run (NOT a fat arrow function bcos we need the 'this' keyword)

// Hash the plain text pwd before saving
userSchema.pre("save", async function (next) {
  //'this' stands for each instance of the user that is about to be saved
  const user = this;
  //check if password has been modified by the user before been saved
  //a modification is when password is newly created along with a user instance or modified
  //hash password below b4 the 'next' function
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8); // 8 is the number of rounds to hash the passsword. it's the most stable number for hashing pwrds
  }
  // the methods on bcrypt - 'hash' and isModified are promises
  //the 'next' argument helps us to exit our asynchronous function when it's done or fulfilled
  next();
});

//Delete all user tasks when user is removed
//we use the 'remove' middleware to achieve this
//we use a keyword function so we can have access to the 'this' variable for the instance of the User
userSchema.pre("remove", async function (next) {
  const user = this;
  await Task.deleteMany({ owner: user._id });
  next();
});

const User = mongoose.model("User", userSchema);
module.exports = User;

/**
 * when using findOneAndUpdate method to update our schema, this method bypasses some advanced features like middlewares in mongoose
 * consequentlythe  middleware is not called for updates. It is only called for the initial save of our schema/model
 * //to fix this some changes will be made on the method - findOneAndUpdate ethod in the user,js router file
 * refer to 'PATCH' HTTP method
 */
