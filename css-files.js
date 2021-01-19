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
const CopyPlugin = require('copy-webpack-plugin');

function transformCssEntry( destination, isProduction ) {
	return ( filename ) => {
		const entry = {};
		entry[ path.parse( filename ).name ] = filename;
		const config = {
			entry: entry,
			output: {
				filename: `[name].work`,
				path: destination,
			},
			plugins: [
				new MiniCssExtractPlugin(
					{
						filename: `[name].min.css`
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
				new CopyPlugin(
					{
						patterns: [
							{ from: filename, to: destination }
						]
					}
				)
			],
			module: {
				rules: [
					{
						test: /\.css$/i,
						use: [ MiniCssExtractPlugin.loader, 'css-loader' ],
					},
				],
			},
			devtool: !isProduction ? 'source-map' : false,
			optimization: {
				minimize: true,
				minimizer: [
					new CssMinimizerPlugin(),
				],
			},
		};
		return config;
	};
}

module.exports = { transformCssEntry };

