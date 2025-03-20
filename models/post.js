const mongoose = require("mongoose");

const postSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    date: {
        type: Date,
        default: Date.now
    },
    content: String,
    likes: [
        { type: mongoose.Schema.Types.ObjectId, ref: "user" }
    ],
    comments: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
            text: String,
            createdAt: { type: Date, default: Date.now }
        }
    ]
});

// Ensure comments are populated with usernames
postSchema.pre(/^find/, function () {
    this.populate("comments.user", "username");
});

module.exports = mongoose.model("post", postSchema);
