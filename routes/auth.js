const express = require("express");

const authController = require("../controllers/auth");

const router = express.Router();

// Login/Logout Section
router.get("/login", authController.getLogin);

router.post("/login", authController.postLogin);

router.post("/logout", authController.postLogout);

// Signup Section
router.get("/signup", authController.getSignup);

router.post("/signup", authController.postSignup);

// Password Reset Request Section
router.get("/reset", authController.getReset);

router.post("/reset", authController.postReset);

// New Password Section
router.get("/reset/:token", authController.getNewPassword);

router.post("/new-password", authController.postNewPassword);

module.exports = router;
