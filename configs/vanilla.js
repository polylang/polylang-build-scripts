/**
 * External dependencies.
 */
const glob = require( 'glob' ).sync;

/**
 * Internal dependencies.
 */
const {
	transformJsEntry,
	createBundledJsConfig,
} = require( '../transformers/js.js' );
const {
	transformCssEntry,
	createBundledCssConfig,
} = require( '../transformers/css.js' );

const dedupeStable = ( fileNames ) => {
	const seen = new Set();

	return fileNames.filter( ( filename ) => {
		if ( seen.has( filename ) ) {
			return false;
		}

		seen.add( filename );
		return true;
	} );
};

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
 * @param {string}   [options.strategy]          Build strategy: `'per-file'` (one config per file per variant, default) or `'bundled'` (four configs total: JS/CSS × min/unmin).
 * @param {string}   [options.entryKey]          Bundled entry key mode: `'basename'` (flat names like per-file, default) or `'relative'` (nested output paths).
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
	strategy = 'per-file',
	entryKey = 'basename',
} ) => {
	if ( strategy !== 'per-file' && strategy !== 'bundled' ) {
		throw new Error(
			`Invalid vanilla build strategy "${ strategy }". Expected "per-file" or "bundled".`
		);
	}

	const jsFileNames = dedupeStable(
		jsPatterns.flatMap( ( pattern ) =>
			glob( pattern, {
				cwd: workingDirectory,
				ignore: jsIgnorePatterns,
			} ).map( ( filename ) => `./${ filename }` )
		)
	);

	const cssFileNames = dedupeStable(
		cssPatterns.flatMap( ( pattern ) =>
			glob( pattern, {
				cwd: workingDirectory,
				ignore: cssIgnorePatterns,
			} ).map( ( filename ) => `./${ filename }` )
		)
	);

	if ( strategy === 'bundled' ) {
		const configs = [];

		if ( jsFileNames.length > 0 ) {
			configs.push(
				createBundledJsConfig(
					jsFileNames,
					jsBuildDirectory,
					false,
					workingDirectory,
					entryKey
				),
				createBundledJsConfig(
					jsFileNames,
					jsBuildDirectory,
					true,
					workingDirectory,
					entryKey
				)
			);
		}

		if ( cssFileNames.length > 0 ) {
			configs.push(
				createBundledCssConfig(
					cssFileNames,
					cssBuildDirectory,
					false,
					isProduction,
					workingDirectory,
					entryKey
				),
				createBundledCssConfig(
					cssFileNames,
					cssBuildDirectory,
					true,
					isProduction,
					workingDirectory,
					entryKey
				)
			);
		}

		return configs;
	}

	return [
		...jsFileNames.map( transformJsEntry( jsBuildDirectory, false ) ),
		...jsFileNames.map( transformJsEntry( jsBuildDirectory, true ) ),
		...cssFileNames.map(
			transformCssEntry( cssBuildDirectory, false, isProduction )
		),
		...cssFileNames.map(
			transformCssEntry( cssBuildDirectory, true, isProduction )
		),
	];
};

module.exports = { getVanillaConfig };
