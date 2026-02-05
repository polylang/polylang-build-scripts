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
 * Returns the SASS rules for the given load paths, source map, and output style.
 *
 * @param {string[]} loadPaths   Custom load paths for SASS imports.
 * @param {boolean}  sourceMap   Whether to enable source maps.
 * @param {string}   outputStyle The output style of the SASS files.
 * @return {Object[]} The SASS rules.
 */
const getSassRules = ( loadPaths, sourceMap, outputStyle ) => {
	if ( outputStyle !== 'compressed' && outputStyle !== 'expanded' ) {
		throw new Error(
			'Invalid output style, must be "compressed" or "expanded"'
		);
	}

	return loadPaths.length > 0
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
									loadPaths,
									outputStyle,
									sourceMap,
								},
							},
						},
					],
				},
		  ]
		: [];
};

/**
 * Returns the main configuration for the given arguments.
 *
 * @param {Object}   options              The options for the webpack configuration.
 * @param {Object}   options.entry        The entry point for the webpack configuration.
 * @param {Object}   options.outputConfig The output configuration for the webpack configuration.
 * @param {Object}   options.optimization The optimization configuration for the webpack configuration.
 * @param {Object}   options.externals    The externals configuration for the webpack configuration.
 * @param {Object}   options.resolve      The resolve configuration for the webpack configuration.
 * @param {Object}   options.devtool      The devtool configuration for the webpack configuration.
 * @param {Object[]} options.moduleRules  The module rules for the webpack configuration.
 * @return {Object} The main configuration for the webpack configuration.
 */
const getMainConfig = ( {
	entry,
	outputConfig,
	optimization,
	externals,
	resolve,
	devtool,
	moduleRules,
} ) => {
	const jsFilename = optimization.minimize
		? './js/build/[name].min.js'
		: './js/build/[name].js';
	const cssFilename = optimization.minimize
		? './css/build/style.min.css'
		: './css/build/style.css';

	return {
		entry,
		output: Object.assign( {}, { filename: jsFilename }, outputConfig ),
		externals,
		resolve,
		module: {
			rules: [ ...moduleRules ],
		},
		plugins: [
			new MiniCssExtractPlugin( {
				filename: cssFilename,
			} ),
		],
		devtool,
		optimization,
	};
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

	const sassRulesMinified = getSassRules(
		sassLoadPaths,
		! isProduction,
		'compressed'
	);
	const sassRulesUnminified = getSassRules(
		sassLoadPaths,
		! isProduction,
		'expanded'
	);

	const minifiedConfig = getMainConfig( {
		entry: entryPoints,
		outputConfig,
		optimization: minimizeOptimizationConfig,
		externals,
		resolve,
		devtool,
		moduleRules: [ ...transpilationRules, ...sassRulesMinified ],
	} );
	const unminifiedConfig = getMainConfig( {
		entry: entryPoints,
		outputConfig,
		optimization: unMinimizeOptimizationConfig,
		externals,
		resolve,
		devtool,
		moduleRules: [ ...transpilationRules, ...sassRulesUnminified ],
	} );

	return [ minifiedConfig, unminifiedConfig ];
};

module.exports = { getReactifiedConfig };
