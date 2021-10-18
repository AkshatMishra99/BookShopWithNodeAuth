const Product = require("../models/product");
const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
exports.getAddProduct = (req, res, next) => {
	res.render("admin/edit-product", {
		pageTitle: "Add Product",
		path: "/admin/add-product",
		editing: false,
		isAuthenticated: req.session.isLoggedIn,
		errorMessage: undefined,
		validationErrors: [],
		userInput: undefined,
		hasError: false
	});
};

exports.postAddProduct = (req, res, next) => {
	const errors = validationResult(req).array();
	if (errors.length > 0) {
		const message = errors[0].msg;
		return res.status(422).render("admin/edit-product", {
			pageTitle: "Add Product",
			path: "/admin/add-product",
			editing: false,
			isAuthenticated: req.session.isLoggedIn,
			errorMessage: message,
			validationErrors: errors,
			hasError: true,
			product: { ...req.body }
		});
	}
	const title = req.body.title;
	const imageUrl = req.file;
	const price = req.body.price;
	const description = req.body.description;
	console.log(imageUrl, req.body);
	const product = new Product({
		title: title,
		price: price,
		description: description,
		imageUrl: imageUrl,
		userId: req.user
	});
	product
		.save()
		.then((result) => {
			// console.log(result);
			console.log("Created Product");
			res.redirect("/admin/products");
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			console.log(error, "here waas an error");
			next(error);
		});
};

exports.getEditProduct = (req, res, next) => {
	const editMode = req.query.edit;
	if (!editMode) {
		return res.redirect("/");
	}
	const prodId = req.params.productId;
	Product.findById(prodId)
		.then((product) => {
			if (!product) {
				return res.redirect("/");
			}
			res.render("admin/edit-product", {
				pageTitle: "Edit Product",
				path: "/admin/edit-product",
				editing: editMode,
				product: product,
				errorMessage: undefined,
				validationErrors: [],
				userInput: undefined,
				hasError: false
			});
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			next(error);
		});
};

exports.postEditProduct = (req, res, next) => {
	const errors = validationResult(req).array();
	if (errors.length > 0) {
		const message = errors[0].msg;
		return res.status(422).render("admin/edit-product", {
			pageTitle: "Edit Product",
			path: "/admin/edit-product",
			editing: true,
			isAuthenticated: req.session.isLoggedIn,
			errorMessage: message,
			validationErrors: errors,
			product: { ...req.body, _id: req.body.productId },
			hasError: true
		});
	}
	const prodId = req.body.productId;
	const updatedTitle = req.body.title;
	const updatedPrice = req.body.price;
	const updatedImageUrl = req.body.imageUrl;
	const updatedDesc = req.body.description;

	Product.findOne({ _id: prodId, userId: req.user._id })
		.then((product) => {
			if (!product) {
				return res.redirect("/404");
			}
			product.title = updatedTitle;
			product.price = updatedPrice;
			product.description = updatedDesc;
			product.imageUrl = updatedImageUrl;
			return product.save().then((result) => {
				console.log("UPDATED PRODUCT!");
				res.redirect("/admin/products");
			});
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			console.log(error);
			next(error);
		});
};

exports.getProducts = (req, res, next) => {
	Product.find({ userId: req.user._id })
		// .select('title price -_id')
		// .populate('userId', 'name')
		.then((products) => {
			console.log(products);
			res.render("admin/products", {
				prods: products,
				pageTitle: "Admin Products",
				path: "/admin/products",
				isAuthenticated: req.session.isLoggedIn
			});
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			next(error);
		});
};

exports.postDeleteProduct = (req, res, next) => {
	const prodId = req.body.productId;
	Product.findOneAndRemove({ _id: prodId, userId: req.user._id })
		.then(() => {
			console.log("DESTROYED PRODUCT");
			res.redirect("/admin/products");
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			next(error);
		});
};
