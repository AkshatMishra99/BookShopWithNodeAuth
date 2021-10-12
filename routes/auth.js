const express = require("express");
const { check, body } = require("express-validator");
const authController = require("../controllers/auth");

const User = require("../models/user");

const router = express.Router();

// Login/Logout Section
router.get("/login", authController.getLogin);

router.post(
	"/login",
	check("email")
		.isEmail()
		.withMessage("Please enter a valid email address!!"),
	check("password")
		.isLength({ min: 4, max: 20 })
		.withMessage("Please enter a valid password!!"),
	authController.postLogin
);

router.post("/logout", authController.postLogout);

// Signup Section
router.get("/signup", authController.getSignup);

router.post(
	"/signup",
	check("email")
		.isEmail()
		.withMessage("Please enter a valid email address!!")
		.custom((value, { req }) => {
			return User.findOne({ email: value }).then((user) => {
				if (user) {
					return Promise.reject(
						"User with the email already exists!!"
					);
				}
			});
		}),
	check("name").isLength({ min: 2 }).withMessage("Name must not be empty!!"),
	check("password")
		.isLength({ min: 4, max: 20 })
		.withMessage("Please enter a valid password!!"),
	body("confirmPassword").custom((value, { req }) => {
		if (value !== req.body.password) {
			throw new Error("Both passwords must match!!");
		}
		return true;
	}),
	authController.postSignup
);

// Password Reset Request Section
router.get("/reset", authController.getReset);

router.post("/reset", authController.postReset);

// New Password Section
router.get("/reset/:token", authController.getNewPassword);

router.post("/new-password", authController.postNewPassword);

module.exports = router;
