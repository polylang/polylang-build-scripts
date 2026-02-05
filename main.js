const { transformCssEntry } = require( './transformers/css' );
const { transformJsEntry } = require( './transformers/js' );
const { getVanillaConfig } = require( './configs/vanilla' );
const { getReactifiedConfig } = require( './configs/reactified' );

module.exports = {
	transformCssEntry,
	transformJsEntry,
	getVanillaConfig,
	getReactifiedConfig,
};
