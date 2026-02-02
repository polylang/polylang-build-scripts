/**
 * External dependencies.
 */
const glob = require( 'glob' ).sync;

/**
 * Internal dependencies.
 */
const { transformCssEntry, transformJsEntry } = require( '../main' );

/**
 * Generate webpack configuration for vanilla JS and CSS files.
 * Finds files using glob patterns and creates minified/unminified versions.
 *
 * @param {Object}   options                     Configuration options.
 * @param {string}   options.workingDirectory    Working directory for glob resolution.
 * @param {string[]} [options.jsPatterns]        Glob patterns for JS files.
 * @param {string[]} [options.jsIgnorePatterns]  Glob patterns to ignore for JS files.
 * @param {string[]} [options.cssPatterns]       Glob patterns for CSS files.
 * @param {string[]} [options.cssIgnorePatterns] Glob patterns to ignore for CSS files.
 * @param {string}   options.jsBuildDirectory    Output directory for JS files.
 * @param {string}   options.cssBuildDirectory   Output directory for CSS files.
 * @param {boolean}  options.isProduction        Whether to enable production mode optimizations.
 * @return {Object[]} Array of webpack configurations.
 */
const getVanillaConfig = ( {
	workingDirectory,
	jsPatterns = [ '**/*.js' ],
	jsIgnorePatterns = [],
	cssPatterns = [ '**/*.css' ],
	cssIgnorePatterns = [],
	jsBuildDirectory,
	cssBuildDirectory,
	isProduction,
} ) => {
	const jsFileNames = jsPatterns.flatMap( ( pattern ) =>
		glob( pattern, {
			cwd: workingDirectory,
			ignore: jsIgnorePatterns,
		} ).map( ( filename ) => `./${ filename }` )
	);

	const cssFileNames = cssPatterns.flatMap( ( pattern ) =>
		glob( pattern, {
			cwd: workingDirectory,
			ignore: cssIgnorePatterns,
		} ).map( ( filename ) => `./${ filename }` )
	);

	return [
		...jsFileNames.map( transformJsEntry( jsBuildDirectory, false ) ),
		...jsFileNames.map( transformJsEntry( jsBuildDirectory, true ) ),
		...cssFileNames.map(
			transformCssEntry( cssBuildDirectory, isProduction )
		),
	];
};

module.exports = { getVanillaConfig };
