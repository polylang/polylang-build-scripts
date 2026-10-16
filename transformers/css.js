/**
 * External dependencies.
 */
const path = require( 'path' );

/**
 * Internal dependencies.
 */
const {
	buildBundledEntry,
	getEntryKeyResolver,
} = require( '../lib/entry-keys.js' );

/**
 * Peer dependencies.
 */
const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' );
const CssMinimizerPlugin = require( 'css-minimizer-webpack-plugin' );
const { CleanWebpackPlugin } = require( 'clean-webpack-plugin' );

function getCssIntermediateFilename( minimize ) {
	return minimize ? '[name].min.work' : '[name].unmin.work';
}

function getCssIntermediateCleanPattern( destination, minimize ) {
	return path.join(
		destination,
		minimize ? '**/*.min.work' : '**/*.unmin.work'
	);
}

/**
 * Prepare webpack configuration to build css files with resolved @import statements.
 *
 * @param {string}  destination  Output directory for the built files.
 * @param {boolean} minimize     True to generate minified files.
 * @param {boolean} isProduction True when building in production mode.
 */
function transformCssEntry( destination, minimize, isProduction ) {
	return ( filename ) => {
		const entry = {};
		entry[ path.parse( filename ).name ] = filename;
		const config = {
			entry,
			output: {
				filename: getCssIntermediateFilename( minimize ),
				path: destination,
			},
			plugins: [
				new MiniCssExtractPlugin( {
					filename: minimize ? `[name].min.css` : `[name].css`,
				} ),
				new CleanWebpackPlugin( {
					dry: false,
					verbose: false,
					cleanOnceBeforeBuildPatterns: [],
					cleanAfterEveryBuildPatterns: [
						getCssIntermediateCleanPattern( destination, minimize ),
					],
				} ),
			],
			module: {
				rules: [
					{
						test: /\.css$/i,
						use: [ MiniCssExtractPlugin.loader, 'css-loader' ],
					},
				],
			},
			devtool: ! minimize && ! isProduction ? 'source-map' : false,
			optimization: {
				minimize,
				minimizer: minimize
					? [
							new CssMinimizerPlugin( {
								test: /\.min\.css$/i,
							} ),
					  ]
					: [],
			},
		};
		return config;
	};
}

/**
 * Build a single webpack config for all vanilla CSS entries (min or unmin).
 *
 * @param {string[]} fileNames                 Relative entry paths.
 * @param {string}   destination               Output directory.
 * @param {boolean}  minimize                  True to generate minified files.
 * @param {boolean}  isProduction              True when building in production mode.
 * @param {string}   context                   Webpack context (working directory).
 * @param {string}   [entryKeyMode='basename'] `'basename'` or `'relative'` entry key mode.
 * @return {Object} Webpack configuration.
 */
function createBundledCssConfig(
	fileNames,
	destination,
	minimize,
	isProduction,
	context,
	entryKeyMode = 'basename'
) {
	const entry = buildBundledEntry(
		fileNames,
		getEntryKeyResolver( entryKeyMode )
	);

	return {
		context,
		entry,
		output: {
			filename: getCssIntermediateFilename( minimize ),
			path: destination,
		},
		plugins: [
			new MiniCssExtractPlugin( {
				filename: minimize ? '[name].min.css' : '[name].css',
			} ),
			new CleanWebpackPlugin( {
				dry: false,
				verbose: false,
				cleanOnceBeforeBuildPatterns: [],
				cleanAfterEveryBuildPatterns: [
					getCssIntermediateCleanPattern( destination, minimize ),
				],
			} ),
		],
		module: {
			rules: [
				{
					test: /\.css$/i,
					use: [ MiniCssExtractPlugin.loader, 'css-loader' ],
				},
			],
		},
		devtool: ! minimize && ! isProduction ? 'source-map' : false,
		optimization: {
			minimize,
			minimizer: minimize
				? [
						new CssMinimizerPlugin( {
							test: /\.min\.css$/i,
						} ),
				  ]
				: [],
			splitChunks: false,
			runtimeChunk: false,
		},
	};
}

module.exports = { transformCssEntry, createBundledCssConfig };
