const express = require('express');
const app = express();
const postModel = require("./models/post");
const userModel = require("./models/user");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', (req, res) => {
    res.render("index");
});

app.get('/login', (req, res) => {
    res.render("login");
});

app.get("/profile", isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({ email: req.user.email }).populate("posts");
    let posts = await postModel.find({ user: user._id }).populate("comments.user");
    res.render("profile", { user, posts });
});

app.get("/feed", isLoggedIn, async (req, res) => {
    let posts = await postModel.find().populate("user").populate("comments.user");
    res.render("feed", { user: req.user, posts });
});


app.get("/like/:id", isLoggedIn, async (req, res) => {
    let post = await postModel.findOne({ _id: req.params.id }).populate("user");

    if (post.likes.indexOf(req.user.userid) === -1) {
        post.likes.push(req.user.userid);
    } else {
        post.likes.splice(post.likes.indexOf(req.user.userid), 1);
    }

    await post.save();
    res.redirect(req.headers.referer || "/profile");
});

app.post("/comment/:postId", isLoggedIn, async (req, res) => {
    let post = await postModel.findById(req.params.postId);
    if (!post) return res.redirect("/profile");

    post.comments.push({
        user: req.user.userid,
        text: req.body.comment
    });

    await post.save();
    res.redirect(req.headers.referer || "/profile");
});

app.get("/edit/:id", isLoggedIn, async (req, res) => {
    let post = await postModel.findOne({ _id: req.params.id }).populate("user");

    // Ensure only the post owner can edit
    if (post.user._id.toString() !== req.user.userid) {
        return res.redirect("/profile");
    }

    res.render("edit", { post });
});

app.post("/update/:id", isLoggedIn, async (req, res) => {
    let post = await postModel.findOneAndUpdate({ _id: req.params.id }, { content: req.body.content });

    res.redirect("/profile");
});

app.post("/post", isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({ email: req.user.email });
    let { content } = req.body;

    let post = await postModel.create({
        user: user._id,
        content
    });

    user.posts.push(post._id);
    await user.save();
    res.redirect("/profile");
});

app.post('/register', async (req, res) => {
    let { email, password, username, name, age } = req.body;

    let user = await userModel.findOne({ email });
    if (user) return res.status(500).send("User already registered");

    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, async (err, hash) => {
            let user = await userModel.create({
                username,
                email,
                age,
                name,
                password: hash
            });

            let token = jwt.sign({ email: email, userid: user._id }, "shhhh");
            res.cookie("token", token);
            res.redirect("/login");
        });
    });
});

app.post('/login', async (req, res) => {
    let { email, password } = req.body;

    let user = await userModel.findOne({ email });
    if (!user) return res.status(500).send("Something went wrong!");

    bcrypt.compare(password, user.password, function (err, result) {
        if (result) {
            let token = jwt.sign({ email: email, userid: user._id }, "shhhh");
            res.cookie("token", token);
            res.status(200).redirect("/profile");
        } else {
            res.redirect("/login");
        }
    });
});

app.get('/logout', (req, res) => {
    res.cookie("token", "");
    res.redirect("/login");
});

function isLoggedIn(req, res, next) {
    if (req.cookies.token === "") res.redirect("/login");
    else {
        let data = jwt.verify(req.cookies.token, "shhhh");
        req.user = data;
        next();
    }
}

app.listen(3000);
