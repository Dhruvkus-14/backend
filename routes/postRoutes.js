const express = require("express");
const router = express.Router();
const Post = require("../models/post");
const User = require("../models/user");

// Ensure user is authenticated before commenting (optional)
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect("/login");
}

// Route to add a comment
router.post("/comment/:postId", ensureAuthenticated, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) return res.redirect("/feed");

        const user = await User.findById(req.user._id);
        if (!user) return res.redirect("/feed");

        // Add new comment
        post.comments.push({
            user: user._id,
            text: req.body.text,
            createdAt: new Date(),
        });

        await post.save();
        res.redirect("/feed");
    } catch (err) {
        console.error(err);
        res.redirect("/feed");
    }
});

module.exports = router;
