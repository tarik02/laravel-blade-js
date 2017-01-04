module.exports = class ViewNotFoundError extends Error {
	constructor(viewName) {
		super(`View ${viewName} not found.`);
	}
}