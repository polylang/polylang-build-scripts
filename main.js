const {
	transformCssEntry,
	createBundledCssConfig,
} = require( './transformers/css' );
const {
	transformJsEntry,
	createBundledJsConfig,
} = require( './transformers/js' );
const { getVanillaConfig } = require( './configs/vanilla' );
const { getReactifiedConfig } = require( './configs/reactified' );
const { runWebpackConfigs } = require( './runner' );

module.exports = {
	transformCssEntry,
	createBundledCssConfig,
	transformJsEntry,
	createBundledJsConfig,
	getVanillaConfig,
	getReactifiedConfig,
	runWebpackConfigs,
};
