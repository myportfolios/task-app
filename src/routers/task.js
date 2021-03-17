//1.import express
const express = require("express");
//2. import models
const Task = require("../models/task");
//3. create router
const router = new express.Router();

//4. import the authentication middleware
const auth = require("../middleware/auth");

/** Task Collection starts************/
//2. POST method to CREATE task
router.post("/tasks", auth, async (req, res) => {
  try {
    //get everything in request body and the id of the authenticated user as a single object to create a new task
    const task = new Task({
      ...req.body,
      owner: req.user._id,
    });
    //save newly created task to database
    await task.save();
    //if promise resolves successfully
    res.send(task);
  } catch (e) {
    //if promise rejects
    res.status(500).send(e);
  }
});

//GET method to get all task from db - READ
/******************options object********************
 1********passing query strings to customize response to client*****
 ********Note -query strings are always strings and they are optional. they are only get acted on if provided, if not provided, code executes with the default route*****
 * GET /tasks?completed=true returns all completed tasks
 * GET /tasks?completed=false returns all incomplete tasks
 * 
 2********'limit' to limit the no of result we get back for any given request*****
 ********'skip' to iterate over  pages*****
 * GET /tasks?limit=10&skip=0 <---example this gets the first page since the limit is 10 and skip is 0
 * GET /tasks?limit=10&skip=10 - skips the first page (first 10) an returns the second page
 3****'sortBy' to sort response based on 'createdAt' property***** 
 * GET /tasks?sortBy=createdAt:desc || asc ---> descending or ascending
 */

router.get("/tasks", auth, async (req, res) => {
  //empty object to construct match ppty
  const match = {};
  //empty object to construct sort ppty
  const sort = {};

  //method 1
  // try {
  //   //call the find() method on the task collection, pass in an empty object
  //   const tasks = await Task.find({ owner: req.user._id });
  //   //send back all the tasks
  //   res.send(tasks);
  // } catch (e) {
  //   //display error if promise rejects
  //   res.status(500).send(e);
  // }

  //method 2
  //check if query includes 'completed'
  if (req.query.completed) {
    match.completed = req.query.completed === "true"; //this converts the value to a boolean
  }
  //check if query includes 'sortBy'
  if (req.query.sortBy) {
    //create a var to hold the query string key/val pair
    //split by the special character used eg _, :
    const parts = req.query.sortBy.split(":");
    //check the value of 'sortBy' and equate to '1' for 'asc' and '-1' for 'desc'
    sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
  }
  try {
    //call the find() method on the task collection, pass in an empty object
    await req.user
      .populate({
        path: "tasks", //path expects a value whcih is name of the path -
        match, //would return tasks based on the query string and return all task if none is provided
        options: {
          //for sorting && || pagination
          limit: parseInt(req.query.limit),
          skip: parseInt(req.query.skip),
          sort, //ppty for sorting into asc || desc
        },
      })
      .execPopulate();
    //send back all the tasks
    res.send(req.user.tasks);
  } catch (e) {
    //display error if promise rejects
    res.status(500).send(e);
  }
});

//GET - method to get a particular task by it's id from db - READ
router.get("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;
  try {
    // const task = await Task.findById(id);
    const task = await Task.findOne({ _id, owner: req.user._id });
    //if task doesn't exist in db
    if (!task) {
      return res.status(401).send();
    }
    //if task exist
    res.send(task);
  } catch (e) {
    //if promise rejects
    res.status(500).send(e);
  }
});

//PATCH - method to update a particular task by it's id from db - UPDATE
router.patch("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;
  const reqBody = req.body;
  const options = { new: true, runValidators: true };
  //validate task updates
  const allowedUpdates = ["description", "completed"];
  const updates = Object.keys(req.body);
  const isUpdateValid = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isUpdateValid) {
    return res.status(404).send({ error: "Invalid payload" });
  }
  try {
    // const task = await Task.findByIdAndUpdate(id, reqBody, options)
    //1.find task
    const task = await Task.findOne({ _id, owner: req.user._id });
    //2.return if task is false
    if (!task) {
      return res.status(404).send();
    }
    //3.loop tru the update with forEach and update the task instance with the received value updates
    updates.forEach((update) => (task[update] = reqBody[update]));
    //save the task
    const updatedTask = await task.save();
    res.send(updatedTask);
  } catch (e) {
    res.status(500).send(e);
  }
});

//DELETE. find and delete a task from db
/**
 * CRUD - DELETE
 */
router.delete("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;
  try {
    const task = await Task.findOneAndDelete({ _id, owner: req.user._id });
    if (!task) {
      return res.status(400).send();
    }
    res.send(task);
  } catch (e) {
    res.status(500).send(e);
  }
});
//4. export router
module.exports = router;

//5. The final step is to import the router in the index.js file
