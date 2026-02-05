/**
 * External dependencies
 */
const path = require( 'path' );

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

module.exports = { transformJsEntry };
