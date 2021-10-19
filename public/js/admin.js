const deleteProduct = (btn) => {
	const csrf = btn.parentNode.querySelector("[name=_csrf]").value;
	const productId = btn.parentNode.querySelector("[name=productId]").value;
	const productElement = btn.closest("article");
	console.log(csrf, productId);
	fetch("/admin/product/" + productId, {
		method: "DELETE",
		headers: {
			"csrf-token": csrf
		}
	})
		.then((result) => {
			console.log(result);
			return result.json();
		})
		.then((data) => {
			console.log(data);
			productElement.parentNode.removeChild(productElement);
		})
		.catch((err) => {
			console.error(err);
		});
};
