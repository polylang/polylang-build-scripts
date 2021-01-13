/**
 * @package Polylang
 */

/**
 * External dependencies.
 */
const path = require( 'path' );
const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' );
const CssMinimizerPlugin = require( 'css-minimizer-webpack-plugin' );
const { CleanWebpackPlugin } = require( 'clean-webpack-plugin' );

const minifiedPlugins = [
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
];
const minifiedOptimization = {
	minimize: true,
	minimizer: [
		new CssMinimizerPlugin(),
	],
};
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

function outputPath(root) {
	return {
		filename: `css/build/[name].css`,
		path: root,
	};
}

function transformCssEntry( destination, isProduction, minify = false ) {
	return ( filename ) => {
		const entry = {};
		entry[ path.parse( filename ).name ] = filename;
		const config = {
			entry: entry,
			output: minify ? outputPath( destination ) : minifiedOutputPath( destination ),
			plugins: minify ? plugins : minifiedPlugins,
			module: {
				rules: [
					{
						test: /\.css$/i,
						use: [ MiniCssExtractPlugin.loader, 'css-loader' ],
					},
				],
			},
			devtool: !isProduction ? 'source-map' : false,
			optimization: minify ? optimization : minifiedOptimization,
		};
		return config;
	};
}

module.exports = { transformCssEntry };