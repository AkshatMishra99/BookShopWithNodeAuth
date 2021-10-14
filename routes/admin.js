const path = require("path");

const express = require("express");
const { body } = require("express-validator");
const adminController = require("../controllers/admin");
const isAuth = require("../middleware/is-auth");
const { isString } = require("util");

const router = express.Router();

// /admin/add-product => GET
router.get("/add-product", isAuth, adminController.getAddProduct);

// /admin/products => GET
router.get("/products", isAuth, adminController.getProducts);

// /admin/add-product => POST
router.post(
	"/add-product",
	isAuth,
	body("title", "Enter valid title!!")
		.isString()
		.trim()
		.isLength({ min: 1, max: 400 }),
	body("imageUrl", "Enter valid image url!!")
		.isURL()
		.trim()
		.isLength({ min: 1 }),
	body("price", "Enter valid price!!").isNumeric(),
	body("description", "Enter valid description!!")
		.trim()
		.isLength({ min: 5, max: 400 }),
	adminController.postAddProduct
);

router.get("/edit-product/:productId", isAuth, adminController.getEditProduct);

router.post(
	"/edit-product",
	isAuth,
	body("title", "Enter valid title!!")
		.isString()
		.trim()
		.isLength({ min: 1, max: 400 }),
	body("imageUrl", "Enter valid image url!!")
		.isURL()
		.trim()
		.isLength({ min: 1 }),
	body("price", "Enter valid price!!").isNumeric(),
	body("description", "Enter valid description!!")
		.trim()
		.isLength({ min: 5, max: 400 }),
	adminController.postEditProduct
);

router.post("/delete-product", isAuth, adminController.postDeleteProduct);

module.exports = router;
