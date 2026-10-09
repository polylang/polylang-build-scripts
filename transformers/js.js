/**
 * External dependencies
 */
const path = require( 'path' );

/**
 * Internal dependencies.
 */
const { getBundledEntryKey } = require( '../lib/entry-keys.js' );

/**
 * Peer dependencies
 */
const TerserPlugin = require( 'terser-webpack-plugin' );

/**
 * Prepare webpack configuration to minify js files to source folder as target folder and suffix file name with .min.js extension.
 *
 * @param {string}  destination Output directory for the built files.
 * @param {boolean} minimize    True to generate minified files.
 */
function transformJsEntry( destination, minimize = false ) {
	return ( filename ) => {
		const entry = {};
		entry[ path.parse( filename ).name ] = filename;
		const output = {
			filename: `${ path.parse( filename ).name }${
				minimize ? '.min' : ''
			}.js`,
			path: destination,
			iife: false, // Avoid Webpack to wrap files into a IIFE which is not needed for this kind of javascript files.
		};
		const config = {
			entry,
			output,
			optimization: {
				minimize,
				minimizer: [ new TerserPlugin( { extractComments: false } ) ],
			},
		};
		return config;
	};
}

/**
 * Build a single webpack config for all vanilla JS entries (min or unmin).
 *
 * @param {string[]} fileNames   Relative entry paths.
 * @param {string}   destination Output directory.
 * @param {boolean}  minimize    True to generate minified files.
 * @param {string}   context     Webpack context (working directory).
 * @return {Object} Webpack configuration.
 */
function createBundledJsConfig( fileNames, destination, minimize, context ) {
	const entry = Object.fromEntries(
		fileNames.map( ( filename ) => [
			getBundledEntryKey( filename ),
			filename,
		] )
	);

	return {
		context,
		entry,
		output: {
			filename: minimize ? '[name].min.js' : '[name].js',
			path: destination,
			iife: false,
		},
		optimization: {
			minimize,
			minimizer: [ new TerserPlugin( { extractComments: false } ) ],
		},
	};
}

module.exports = { transformJsEntry, createBundledJsConfig };
