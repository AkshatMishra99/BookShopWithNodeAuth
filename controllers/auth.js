const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const sendGridTransport = require("nodemailer-sendgrid-transport");

const transporter = nodemailer.createTransport(
	sendGridTransport({
		auth: {
			api_key:
				"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"
		}
	})
);

const User = require("../models/user");

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
						return transporter.sendMail({
							to: email,
							from: "mailakshat99@gmail.com",
							subject: "Signup Succeeded!!",
							html: `<body>
										<h1>Signup completed successfully!!</h1>
										<h2>Your username is: ${email}</h2>
										<h2>Your password is: ${password}</h2>
									</body>`
						});
					})
					.then(() => {
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

exports.getReset = (req, res, next) => {
	let message = req.flash("error");
	if (message && message.length > 0) {
		message = message[0];
	}
	return res.render("auth/reset", {
		path: "/reset",
		pageTitle: "Reset Password",
		errorMessage: message
	});
};

exports.postReset = (req, res, next) => {
	const { email } = req.body;
	if (!email) {
		req.flash("error", "Enter valid Email");
		return res.redirect("/reset");
	}
	crypto.randomBytes(32, (err, buffer) => {
		if (err) {
			console.log("error", err);
			req.flash("error", "Some error occured!!");
			return res.redirect("/reset");
		}
		const token = buffer.toString("hex");
		User.findOne({ email: email })
			.then((user) => {
				if (!user) {
					console.log(err);
					req.flash("error", "No account with that email address!!");
					return res.redirect("/reset");
				}
				user.resetToken = token;
				user.resetTokenExpiration = Date.now() + 3600000;
				return user.save();
			})
			.then((result) => {
				res.redirect("/");
				transporter.sendMail({
					to: email,
					from: "mailakshat99@gmail.com",
					subject: "Reset Password",
					html: `
						<p>You requested to reset your password</p>
						<p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password</p>
					`
				});
			})
			.catch((err) => {
				console.log(err);
				req.flash("error", "Some error occured!!");
				return res.redirect("/reset");
			});
	});
};

exports.getNewPassword = (req, res, next) => {
	const token = req.params.token;
	return User.findOne({
		resetToken: token,
		resetTokenExpiration: { $gt: Date.now() }
	})
		.then((user) => {
			if (!user) {
				return res.redirect("/404");
			}
			let message = req.flash("error");
			if (message && message.length > 0) {
				message = message[0];
			}
			res.render("auth/new-password", {
				path: "new-password",
				pageTitle: "New Password",
				errorMessage: message,
				userId: user._id.toString(),
				passwordToken: token
			});
		})
		.catch((err) => {
			console.log(err);
			return res.redirect("/404");
		});
};

exports.postNewPassword = (req, res, next) => {
	const {
		userId,
		password: newPassword,
		confirmPassword,
		passwordToken
	} = req.body;
	if (!newPassword || !userId) {
		req.flash("error", "Incomplete details!!");
		return res.redirect("/reset/" + passwordToken);
	}
	if (newPassword !== confirmPassword) {
		req.flash("error", "Both Passwords must match!!");
		return res.redirect("/reset/" + passwordToken);
	}
	return User.findOne({
		_id: userId,
		resetToken: passwordToken,
		resetTokenExpiration: { $gt: Date.now() }
	})
		.then((user) => {
			if (!user) {
				console.log("User not found!!");
				return res.redirect("/404");
			}
			user.password = newPassword;
			user.resetToken = undefined;
			user.resetTokenExpiration = undefined;
			return user
				.save()
				.then((result) => {
					transporter.sendMail({
						to: user.email,
						from: "mailakshat99@gmail.com",
						subject: "Password Updated Successfully!!",
						html: `<h1>Password has been changed successfully!!</h1>
								<h2>Your new password is ${newPassword}</h2>
						`
					});
					return res.redirect("/login");
				})
				.catch((err) => {
					console.log(err);
				});
		})
		.catch((error) => {
			console.log(error);
			return res.redirect("/404");
		});
};
