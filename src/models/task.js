const mongoose = require("mongoose");

//create  schema to enable the use of middleware
const taskSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
      trim: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User", //mongoose allows us to use 'ref' to reference a model from another model. this creates a relationship
    },
  },
  {
    timestamps: true, //using timestamps in the options obj is made possible by explicitly using a schema
  }
);

//create a model/schema by calling the 'model' method on mongoose and passing in the preferred collection name and the object to define the collection

/**
 * Use pre method on Schema to apply changes
 */
// taskSchema.pre("save",function(){

// })
const Task = mongoose.model("Task", taskSchema);

module.exports = Task;
