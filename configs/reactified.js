/**
 * Peer dependencies.
 */
const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' );
const TerserPlugin = require( 'terser-webpack-plugin' );

/**
 * Given a string, returns a new string with dash separators converted to
 * camelCase equivalent. This is not as aggressive as `_.camelCase` in
 * converting to uppercase, where Lodash will also capitalize letters
 * following numbers.
 *
 * @param {string} string Input dash-delimited string.
 * @return {string} Camel-cased string.
 */
const camelCaseDash = ( string ) => {
	return string.replace( /-([a-z])/g, ( match, letter ) =>
		letter.toUpperCase()
	);
};

/**
 * Generate webpack configuration for React-based builds (blocks, editors).
 *
 * @param {Object}   options                       Configuration options.
 * @param {Object}   options.entryPoints           Entry points object (e.g., { blocks: './js/src/blocks/index.js' }).
 * @param {string}   options.outputPath            Base path for output files (__dirname).
 * @param {string}   options.libraryName           Library name for the bundle (e.g., 'polylang', 'polylang-pro').
 * @param {boolean}  options.isProduction          Whether to enable production mode optimizations.
 * @param {string[]} options.wpDependencies        WordPress package dependencies to mark as externals.
 * @param {Object}   [options.additionalExternals] Additional external dependencies.
 * @param {string[]} [options.sassLoadPaths]       Custom load paths for SASS imports.
 * @return {Object[]} Array of webpack configurations (minified and unminified).
 */
const getReactifiedConfig = ( {
	entryPoints,
	outputPath,
	libraryName,
	isProduction,
	wpDependencies,
	additionalExternals = {},
	sassLoadPaths = [],
} ) => {
	const externals = {
		react: 'React',
		...additionalExternals,
	};

	wpDependencies.forEach( ( name ) => {
		externals[ `@wordpress/${ name }` ] = {
			this: [ 'wp', camelCaseDash( name ) ],
		};
	} );

	const devtool = ! isProduction ? 'source-map' : false;

	const resolve = {
		modules: [ outputPath, 'node_modules' ],
	};

	const outputConfig = {
		path: outputPath,
		library: [ libraryName ],
		libraryTarget: 'this',
	};

	const minimizeOptimizationConfig = {
		minimize: true,
		minimizer: [
			new TerserPlugin( {
				terserOptions: {
					format: {
						comments: false,
					},
				},
				extractComments: false,
			} ),
		],
	};

	const unMinimizeOptimizationConfig = {
		minimize: false,
	};

	const transpilationRules = [
		{
			test: /\.js$/,
			exclude: /node_modules/,
			use: 'babel-loader',
		},
	];

	const sassRulesMinified =
		sassLoadPaths.length > 0
			? [
					{
						test: /\.s?css$/,
						use: [
							MiniCssExtractPlugin.loader,
							'css-loader',
							{
								loader: 'sass-loader',
								options: {
									sassOptions: {
										loadPaths: sassLoadPaths,
										outputStyle: 'compressed',
										sourceMap: ! isProduction,
									},
								},
							},
						],
					},
			  ]
			: [];

	const sassRulesUnminified =
		sassLoadPaths.length > 0
			? [
					{
						test: /\.s?css$/,
						use: [
							MiniCssExtractPlugin.loader,
							'css-loader',
							{
								loader: 'sass-loader',
								options: {
									sassOptions: {
										loadPaths: sassLoadPaths,
										outputStyle: 'expanded',
										sourceMap: ! isProduction,
									},
								},
							},
						],
					},
			  ]
			: [];

	const minifiedConfig = {
		entry: entryPoints,
		output: Object.assign(
			{},
			{ filename: './js/build/[name].min.js' },
			outputConfig
		),
		externals,
		resolve,
		module: {
			rules: [ ...transpilationRules, ...sassRulesMinified ],
		},
		plugins: [
			new MiniCssExtractPlugin( {
				filename: './css/build/style.min.css',
			} ),
		],
		devtool,
		optimization: minimizeOptimizationConfig,
	};

	const unminifiedConfig = {
		entry: entryPoints,
		output: Object.assign(
			{},
			{ filename: './js/build/[name].js' },
			outputConfig
		),
		externals,
		resolve,
		module: {
			rules: [ ...transpilationRules, ...sassRulesUnminified ],
		},
		plugins: [
			new MiniCssExtractPlugin( {
				filename: './css/build/style.css',
			} ),
		],
		devtool,
		optimization: unMinimizeOptimizationConfig,
	};

	return [ minifiedConfig, unminifiedConfig ];
};

module.exports = { getReactifiedConfig };
