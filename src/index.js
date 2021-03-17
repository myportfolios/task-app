/**
 * require express
 * configure nodemon in package json
 * set up app from express
 * connect app to port || localhost
 */

//configure mongoose to connect to database when application loads
require("./db/mongoose");

//require models to create instances - models moved into router files

//import the userRouter
const userRouter = require("./routers/user");
//import the taskRouter
const taskRouter = require("./routers/task");
//1. call express fn and save to a constant
const express = require("express");

//2. create app by calling constant from 1. above
const app = express();
//3. Define deployment port for heroku server and localhost. Express app will use whichever env available
const port = process.env.PORT;

//4. require jsonwebtoken
/**
 * call the method sign() on the jwt instance and pass in 2 arguments to reate a token
 * @param object - a unique identifier like id passed in the payload
 * @param secret a string which be used to authenticate the token
 * @param object -optional. a key of 'expiresIn' and a string value of duration before the token epires
 */

//express middleware to authentication should be put in a separate file
//4/ configure all json responses to be parsed into javascript object by express
app.use(express.json());
//use userRouter
app.use(userRouter);
//use taskRouter
app.use(taskRouter);

app.listen(port, () => {
  console.log("Server started on port " + port);
});

//password algorithms
//encryption algorithms can be reversed to the plain password
//hashing algorithms cannot be reversed.they are one way algorithms

//check www.base64decode.org to ecode jwt token
//another option is jwt.io
/**
 * We use .sign() method to screate a token and .verify() to verify a token
 * The jwt generated are separated by periods.
 * 1.the first part is the header and contains information like the type of jwt generated
 * 2.the second part contains the unique payload we provided to generate the token
 * 3.the third part contains the secret which is used to validate the payload.
 */
