/**
 * @package Polylang
 */

/**
 * External dependencies.
 */
const path = require( 'path' );

/**
 * Peer Dependencies.
 * Need to be installed in the project folder.
 * For this reason, they cannot be instantiated from this file, but from the root of the project instead.
 */
const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' );
const CssMinimizerPlugin = require( 'css-minimizer-webpack-plugin' );
const { CleanWebpackPlugin } = require( 'clean-webpack-plugin' );

const minifiedPlugins = () => ([
	new MiniCssExtractPlugin(
		{
			filename: `css/build/[name].min.css`
		}
	),
	new CleanWebpackPlugin(
		{
			dry: false,
			verbose: false,
			cleanOnceBeforeBuildPatterns: [],
			cleanAfterEveryBuildPatterns: [
				'**/*.work',
				'**/*.LICENSE.txt'
			],
		}
	),
]);

const minifiedOptimization = () => ({
	minimize: true,
	minimizer: [
		new CssMinimizerPlugin(),
	],
});

function minifiedOutputPath( destination ) {
	return {
		filename: `css/[name].work`,
		path: destination,
	};
}

const optimization = {
	minimize: false
};

const plugins = [];

function outputPath(destination) {
	return {
		filename: `css/build/[name].css`,
		path: destination,
	};
}

function minifiedLoaders() {
	return [ MiniCssExtractPlugin.loader, 'css-loader' ];
}

const loaders = [ 'css-loader' ];

function transformCssEntry( destination, isProduction, minify = false ) {
	return ( filename ) => {
		const entry = {};
		entry[ path.parse( filename ).name ] = filename;
		const config = {
			entry: entry,
			output: minify ? minifiedOutputPath( destination ) : outputPath( destination ),
			plugins: minify ? minifiedPlugins() : plugins,
			module: {
				rules: [
					{
						test: /\.css$/i,
						use: minify ? minifiedLoaders() : loaders,
					},
				],
			},
			devtool: !isProduction ? 'source-map' : false,
			optimization: minify ? minifiedOptimization() : optimization,
		};
		return config;
	};
}

module.exports = { transformCssEntry };