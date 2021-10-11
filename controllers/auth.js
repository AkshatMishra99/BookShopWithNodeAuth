const User = require("../models/user");
const bcrypt = require("bcryptjs");

exports.getLogin = (req, res, next) => {
	res.render("auth/login", {
		path: "/login",
		pageTitle: "Login",
		isAuthenticated: false
	});
};

exports.getSignup = (req, res, next) => {
	res.render("auth/signup", {
		path: "/signup",
		pageTitle: "Signup",
		isAuthenticated: false
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
							return res.redirect("/login");
						}
					})
					.catch((err) => {
						console.error(err);
						res.redirect("/login");
					});
			} else {
				console.log("User login failed!!");
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
		return res.redirect("/");
	}
	return User.findOne({ email: email })
		.then((user) => {
			if (user) {
				console.log("User with the email already exists!");
				res.redirect("/");
				return null;
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
