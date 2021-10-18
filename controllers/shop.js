const Product = require("../models/product");
const Order = require("../models/order");
const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");

exports.getProducts = (req, res, next) => {
	Product.find()
		.then((products) => {
			console.log(products);
			res.render("shop/product-list", {
				prods: products,
				pageTitle: "All Products",
				path: "/products",
				isAuthenticated: req.session.isLoggedIn
			});
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			next(error);
		});
};

exports.getProduct = (req, res, next) => {
	const prodId = req.params.productId;
	Product.findById(prodId)
		.then((product) => {
			res.render("shop/product-detail", {
				product: product,
				pageTitle: product.title,
				path: "/products",
				isAuthenticated: req.session.isLoggedIn
			});
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			next(error);
		});
};
exports.getIndex = (req, res, next) => {
	Product.find()
		.then((products) => {
			res.render("shop/index", {
				prods: products,
				pageTitle: "Shop",
				path: "/",
				isAuthenticated: req.session.isLoggedIn
			});
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			next(error);
		});
};

exports.getCart = (req, res, next) => {
	req.user
		.populate("cart.items.productId")
		.execPopulate()
		.then((user) => {
			const products = user.cart.items;
			res.render("shop/cart", {
				path: "/cart",
				pageTitle: "Your Cart",
				products: products,
				isAuthenticated: req.session.isLoggedIn
			});
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			next(error);
		});
};

exports.postCart = (req, res, next) => {
	const prodId = req.body.productId;
	Product.findById(prodId)
		.then((product) => {
			return req.user.addToCart(product);
		})
		.then((result) => {
			console.log(result);
			res.redirect("/cart");
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			next(error);
		});
};

exports.postCartDeleteProduct = (req, res, next) => {
	const prodId = req.body.productId;
	req.user
		.removeFromCart(prodId)
		.then((result) => {
			res.redirect("/cart");
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			next(error);
		});
};

exports.postOrder = (req, res, next) => {
	req.user
		.populate("cart.items.productId")
		.execPopulate()
		.then((user) => {
			const products = user.cart.items.map((i) => {
				return {
					quantity: i.quantity,
					product: { ...i.productId._doc }
				};
			});
			const order = new Order({
				user: {
					name: req.user.name,
					userId: req.user
				},
				products: products
			});
			return order.save();
		})
		.then((result) => {
			return req.user.clearCart();
		})
		.then(() => {
			res.redirect("/orders");
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			next(error);
		});
};

exports.getOrders = (req, res, next) => {
	Order.find({ "user.userId": req.user._id })
		.then((orders) => {
			res.render("shop/orders", {
				path: "/orders",
				pageTitle: "Your Orders",
				orders: orders,
				isAuthenticated: req.session.isLoggedIn
			});
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			next(error);
		});
};
exports.getInvoice = (req, res, next) => {
	const orderId = req.params.orderId;
	Order.findById(orderId)
		.then((order) => {
			if (!order) {
				return next(new Error("Order not found!!"));
			}
			if (order.user.userId.toString() === req.user._id.toString()) {
				const invoiceName = "invoice-" + orderId + ".pdf";
				const invoicePath = path.join("data", "invoices", invoiceName);
				/* Sending data as whole */
				// fs.readFile(invoicePath, (err, data) => {
				// 	if (err) return next(err);
				// 	res.set("Content-Type", "application/pdf");
				// 	res.setHeader(
				// 		"Content-Disposition",
				// 		'inline; filename="' + invoiceName + '"'
				// 	);
				// 	res.send(data);
				// });

				/* Streaming data from the server */
				const file = fs.createReadStream(invoicePath);
				res.set("Content-Type", "application/pdf");
				res.setHeader(
					"Content-Disposition",
					'inline; filename="' + invoiceName + '"'
				);
				file.pipe(res);
			} else {
				const error = new Error("Authentication failed");
				console.log(error);
				error.httpStatusCode = 500;
				return next(error);
			}
		})
		.catch((error) => {
			return next(error);
		});
};
