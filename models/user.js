require("dotenv").config();
const mongoose = require('mongoose');

mongoose
  .connect(process.env.MONGO_URL )
  .then((e)=> console.log("mongodb connected"));

const userSchema = mongoose.Schema({
    username: String,
    name: String,
    age: Number,
    email: String,
    password: String,
    profilepic: {
        type: String,
        default: "default.png"
    },
    posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "post"
    }],
});  

module.exports = mongoose.model('user', userSchema);