/**
 * External dependencies.
 */
const path = require( 'path' );

/**
 * Internal dependencies.
 */
const { getBundledEntryKey } = require( '../lib/entry-keys.js' );

/**
 * Peer dependencies.
 */
const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' );
const CssMinimizerPlugin = require( 'css-minimizer-webpack-plugin' );
const { CleanWebpackPlugin } = require( 'clean-webpack-plugin' );

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
				filename: `[name].work`,
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
						path.join( process.cwd(), '**/*.work' ),
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
 * @param {string[]} fileNames    Relative entry paths.
 * @param {string}   destination  Output directory.
 * @param {boolean}  minimize     True to generate minified files.
 * @param {boolean}  isProduction True when building in production mode.
 * @param {string}   context      Webpack context (working directory).
 * @return {Object} Webpack configuration.
 */
function createBundledCssConfig(
	fileNames,
	destination,
	minimize,
	isProduction,
	context
) {
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
			filename: '[name].work',
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
					path.join( destination, '**/*.work' ),
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
}

module.exports = { transformCssEntry, createBundledCssConfig };
