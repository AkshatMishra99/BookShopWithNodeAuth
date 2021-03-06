const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");

const errorController = require("./controllers/error");
const User = require("./models/user");

const MONGODB_URI =
	"mongodb+srv://mailakshat99:zedith9903@cluster0.0qj8u.mongodb.net/Shop?retryWrites=true&w=majority";
const SESSIONDB_URI =
	"mongodb+srv://mailakshat99:zedith9903@cluster0.0qj8u.mongodb.net/Auth?retryWrites=true&w=majority";
const app = express();
const store = new MongoDBStore({
	uri: SESSIONDB_URI,
	collection: "sessions"
});
const csrfProtection = csrf();

app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
	session({
		secret: "my secret",
		resave: false,
		saveUninitialized: false,
		store: store
	})
);
app.use(csrfProtection);
app.use(flash());
app.use((req, res, next) => {
	if (!req.session.user) {
		return next();
	}
	User.findById(req.session.user._id)
		.then((user) => {
			req.user = user;
			next();
		})
		.catch((err) => console.log(err));
});

app.use((req, res, next) => {
	res.locals.isAuthenticated = req.isLoggedIn;
	res.locals.csrfToken = req.csrfToken();
	next();
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use((error, req, res, next) => {
	return res.status(500).redirect("/500");
});

app.use("/500", errorController.get500);
app.use(errorController.get404);

mongoose
	.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
	.then((result) => {
		app.listen(3000);
	})
	.catch((err) => {
		console.log(err);
	});
