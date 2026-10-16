/**
 * Internal dependencies
 */
const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' );
const CssMinimizerPlugin = require( 'css-minimizer-webpack-plugin' );
const { CleanWebpackPlugin } = require( 'clean-webpack-plugin' );
const { transformCssEntry } = require( './css.js' );

describe( 'transformCssEntry', () => {
	const destination = '/tmp/css/build';

	const getConfig = ( minimize, isProduction, filename = './style.css' ) =>
		transformCssEntry( destination, minimize, isProduction )( filename );

	const getExtractFilename = ( config ) =>
		config.plugins.find(
			( plugin ) => plugin instanceof MiniCssExtractPlugin
		).options.filename;

	it( 'should return a function that produces a webpack config', () => {
		const factory = transformCssEntry( destination, false, true );

		expect( typeof factory ).toBe( 'function' );
		expect( getConfig( false, true ).entry.style ).toBe( './style.css' );
	} );

	it( 'should configure unminified CSS output', () => {
		const config = getConfig( false, true );

		expect( getExtractFilename( config ) ).toBe( '[name].css' );
		expect( config.optimization.minimize ).toBe( false );
		expect( config.optimization.minimizer ).toEqual( [] );
		expect( config.output.path ).toBe( destination );
	} );

	it( 'should configure minified CSS output', () => {
		const config = getConfig( true, true );

		expect( getExtractFilename( config ) ).toBe( '[name].min.css' );
		expect( config.optimization.minimize ).toBe( true );
		expect( config.optimization.minimizer ).toHaveLength( 1 );
		expect( config.optimization.minimizer[ 0 ] ).toBeInstanceOf(
			CssMinimizerPlugin
		);
	} );

	it( 'should not include CopyPlugin', () => {
		const config = getConfig( false, true );

		expect(
			config.plugins.some(
				( plugin ) => plugin.constructor.name === 'CopyPlugin'
			)
		).toBe( false );
	} );

	it( 'should use css-loader and MiniCssExtractPlugin.loader', () => {
		const config = getConfig( false, true );
		const rule = config.module.rules[ 0 ];

		expect( rule.test.toString() ).toBe( '/\\.css$/i' );
		expect( rule.use ).toHaveLength( 2 );
		expect( rule.use[ 0 ] ).toBe( MiniCssExtractPlugin.loader );
		expect( rule.use[ 1 ] ).toBe( 'css-loader' );
	} );

	it( 'should enable source maps for unminified development builds', () => {
		expect( getConfig( false, false ).devtool ).toBe( 'source-map' );
		expect( getConfig( false, true ).devtool ).toBe( false );
		expect( getConfig( true, false ).devtool ).toBe( false );
		expect( getConfig( true, true ).devtool ).toBe( false );
	} );

	it( 'should use distinct intermediate filenames for min and unmin', () => {
		expect( getConfig( false, true ).output.filename ).toBe(
			'[name].unmin.work'
		);
		expect( getConfig( true, true ).output.filename ).toBe(
			'[name].min.work'
		);
	} );

	it( 'should scope clean patterns to the destination directory', () => {
		const unminConfig = getConfig( false, true );
		const minConfig = getConfig( true, true );
		const unminClean = unminConfig.plugins.find(
			( plugin ) => plugin instanceof CleanWebpackPlugin
		);
		const minClean = minConfig.plugins.find(
			( plugin ) => plugin instanceof CleanWebpackPlugin
		);

		expect( unminClean.cleanAfterEveryBuildPatterns ).toEqual( [
			`${ destination }/**/*.unmin.work`,
		] );
		expect( minClean.cleanAfterEveryBuildPatterns ).toEqual( [
			`${ destination }/**/*.min.work`,
		] );
	} );
} );
