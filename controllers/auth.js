const User = require("../models/user");
const bcrypt = require("bcryptjs");

exports.getLogin = (req, res, next) => {
	if (req.session.isLoggedIn) {
		return res.redirect("/");
	} else {
		let message = req.flash("error");
		if (message && message.length > 0) {
			message = message[0];
		}
		res.render("auth/login", {
			path: "/login",
			pageTitle: "Login",
			isAuthenticated: false,
			errorMessage: message
		});
	}
};

exports.getSignup = (req, res, next) => {
	if (req.session.isLoggedIn) {
		return res.redirect("/");
	}
	let message = req.flash("error");
	if (message && message.length > 0) {
		message = message[0];
	}
	res.render("auth/signup", {
		path: "/signup",
		pageTitle: "Signup",
		isAuthenticated: false,
		errorMessage: message
	});
};

exports.postLogin = (req, res, next) => {
	const { email, password } = req.body;
	return User.findOne({ email: email })
		.then((user) => {
			if (user) {
				bcrypt
					.compare(password, user.password)
					.then((doMatch) => {
						if (doMatch) {
							req.session.isLoggedIn = true;
							req.session.user = user;
							req.session.save((err) => {
								console.log(err);
								return res.redirect("/");
							});
						} else {
							req.flash("error", "Incorrect Password!!");
							return res.redirect("/login");
						}
					})
					.catch((err) => {
						console.error(err);
						res.redirect("/login");
					});
			} else {
				console.log("User login failed!!");
				req.flash("error", "Invalid Email!!");
				return res.redirect("/login");
			}
		})
		.catch((err) => console.log(err));
};

exports.postSignup = (req, res, next) => {
	const { email, name, password, confirmPassword } = req.body;
	console.log(email, password);
	if (!email || !password || !name) {
		console.log("Incomplete details!!");
		req.flash("error", "Incomplete details!!");
		return res.redirect("/signup");
	}
	return User.findOne({ email: email })
		.then((user) => {
			if (user) {
				console.log("User with the email already exists!");
				req.flash("error", "User with the email already exists!");
				return res.redirect("/signup");
			} else {
				const newUser = new User({
					email,
					name,
					password,
					cart: { items: [] }
				});
				return newUser
					.save()
					.then((result) => {
						console.log(result);
						return res.redirect("/login");
					})
					.catch((err) => {
						console.log(err);
					});
			}
		})
		.catch((err) => {
			console.log(err);
		});
};

exports.postLogout = (req, res, next) => {
	req.session.destroy((err) => {
		console.log(err);
		res.redirect("/");
	});
};
