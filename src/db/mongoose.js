const mongoose = require("mongoose");

/**
 * Mongoose which is built off of MongoDB has similar structure and requirements for connecting to a database\
 * call the connect method on mongoose (just like MongoClient in mongodb) and pass in 1) the connectionURL, 2) optional options object 3) a callback function to handle error/successful connection
 * Also in Mongoose, we don't specify the database name separately like we do in mongoDB, we provide it along with the url string
 * connectionURL = URL + database name {string}
 */

const connectionURL = process.env.DATABASE_URL;
mongoose.connect(connectionURL, {
  useNewUrlParser: true,
  useCreateIndex: true, //this makes sure that when mongoose works with mongodb our indexes are created allowing us to access data we need to access
  useUnifiedTopology: true,
  useFindAndModify: false,
});
