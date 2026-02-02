/**
 * Internal dependencies
 */
const { getReactifiedConfig } = require( './reactified' );

describe( 'getReactifiedConfig', () => {
	const defaultWpDependencies = [
		'api-fetch',
		'block-editor',
		'blocks',
		'components',
		'data',
		'editor',
		'element',
		'hooks',
		'i18n',
		'primitives',
	];

	const baseOptions = {
		entryPoints: { blocks: './js/src/blocks/index.js' },
		outputPath: '/test/path',
		libraryName: 'polylang',
		isProduction: true,
		wpDependencies: defaultWpDependencies,
	};

	it( 'should return an array with two configurations', () => {
		const configs = getReactifiedConfig( baseOptions );

		expect( configs ).toBeInstanceOf( Array );
		expect( configs ).toHaveLength( 2 );
	} );

	it( 'should have minified and unminified output filenames', () => {
		const configs = getReactifiedConfig( baseOptions );
		const [ minified, unminified ] = configs;

		expect( minified.output.filename ).toBe( './js/build/[name].min.js' );
		expect( unminified.output.filename ).toBe( './js/build/[name].js' );
	} );

	it( 'should configure entry points correctly', () => {
		const entryPoints = {
			blocks: './js/src/blocks/index.js',
			sidebar: './js/src/sidebar/index.js',
		};

		const configs = getReactifiedConfig( {
			...baseOptions,
			entryPoints,
		} );

		configs.forEach( ( config ) => {
			expect( config.entry ).toEqual( entryPoints );
		} );
	} );

	it( 'should set correct output path and library name', () => {
		const configs = getReactifiedConfig( baseOptions );

		configs.forEach( ( config ) => {
			expect( config.output.path ).toBe( '/test/path' );
			expect( config.output.library ).toEqual( [ 'polylang' ] );
			expect( config.output.libraryTarget ).toBe( 'this' );
		} );
	} );

	it( 'should configure default externals (react)', () => {
		const configs = getReactifiedConfig( baseOptions );

		configs.forEach( ( config ) => {
			expect( config.externals.react ).toBe( 'React' );
		} );
	} );

	it( 'should configure WordPress package externals with camelCase', () => {
		const configs = getReactifiedConfig( baseOptions );

		configs.forEach( ( config ) => {
			expect( config.externals[ '@wordpress/blocks' ] ).toEqual( {
				this: [ 'wp', 'blocks' ],
			} );
			expect( config.externals[ '@wordpress/block-editor' ] ).toEqual( {
				this: [ 'wp', 'blockEditor' ],
			} );
			expect( config.externals[ '@wordpress/api-fetch' ] ).toEqual( {
				this: [ 'wp', 'apiFetch' ],
			} );
		} );
	} );

	it( 'should use provided WordPress dependencies', () => {
		const customWpDeps = [ 'blocks', 'element', 'compose', 'edit-post' ];
		const configs = getReactifiedConfig( {
			...baseOptions,
			wpDependencies: customWpDeps,
		} );

		configs.forEach( ( config ) => {
			expect( config.externals[ '@wordpress/blocks' ] ).toBeDefined();
			expect( config.externals[ '@wordpress/element' ] ).toBeDefined();
			expect( config.externals[ '@wordpress/compose' ] ).toBeDefined();
			expect( config.externals[ '@wordpress/edit-post' ] ).toEqual( {
				this: [ 'wp', 'editPost' ],
			} );
			// Should not include deps not in the provided list
			expect(
				config.externals[ '@wordpress/api-fetch' ]
			).toBeUndefined();
		} );
	} );

	it( 'should allow additional custom externals', () => {
		const additionalExternals = {
			lodash: 'lodash',
			moment: 'moment',
		};

		const configs = getReactifiedConfig( {
			...baseOptions,
			additionalExternals,
		} );

		configs.forEach( ( config ) => {
			expect( config.externals.lodash ).toBe( 'lodash' );
			expect( config.externals.moment ).toBe( 'moment' );
			// Should not include deps not in the provided list
			expect( config.externals.jQuery ).toBeUndefined();
		} );
	} );

	it( 'should enable minification for first config', () => {
		const configs = getReactifiedConfig( baseOptions );
		const [ minified ] = configs;

		expect( minified.optimization.minimize ).toBe( true );
		expect( minified.optimization.minimizer ).toBeDefined();
		expect( minified.optimization.minimizer ).toHaveLength( 1 );
	} );

	it( 'should disable minification for second config', () => {
		const configs = getReactifiedConfig( baseOptions );
		const [ , unminified ] = configs;

		expect( unminified.optimization.minimize ).toBe( false );
	} );

	it( 'should enable source maps in development mode', () => {
		const configs = getReactifiedConfig( {
			...baseOptions,
			isProduction: false,
		} );

		configs.forEach( ( config ) => {
			expect( config.devtool ).toBe( 'source-map' );
		} );
	} );

	it( 'should disable source maps in production mode', () => {
		const configs = getReactifiedConfig( {
			...baseOptions,
			isProduction: true,
		} );

		configs.forEach( ( config ) => {
			expect( config.devtool ).toBe( false );
		} );
	} );

	it( 'should configure babel-loader for JS files', () => {
		const configs = getReactifiedConfig( baseOptions );

		configs.forEach( ( config ) => {
			const jsRule = config.module.rules.find(
				( rule ) => rule.test.toString() === /\.js$/.toString()
			);

			expect( jsRule ).toBeDefined();
			expect( jsRule.use ).toBe( 'babel-loader' );
			expect( jsRule.exclude.toString() ).toBe(
				/node_modules/.toString()
			);
		} );
	} );

	it( 'should configure MiniCssExtractPlugin', () => {
		const configs = getReactifiedConfig( baseOptions );
		const [ minified, unminified ] = configs;

		expect( minified.plugins ).toHaveLength( 1 );
		expect( unminified.plugins ).toHaveLength( 1 );

		// Check plugin options
		expect( minified.plugins[ 0 ].options.filename ).toBe(
			'./css/build/style.min.css'
		);
		expect( unminified.plugins[ 0 ].options.filename ).toBe(
			'./css/build/style.css'
		);
	} );

	it( 'should configure resolve modules', () => {
		const configs = getReactifiedConfig( baseOptions );

		configs.forEach( ( config ) => {
			expect( config.resolve.modules ).toContain( '/test/path' );
			expect( config.resolve.modules ).toContain( 'node_modules' );
		} );
	} );

	it( 'should work with custom library name', () => {
		const configs = getReactifiedConfig( {
			...baseOptions,
			libraryName: 'custom-library',
		} );

		configs.forEach( ( config ) => {
			expect( config.output.library ).toEqual( [ 'custom-library' ] );
		} );
	} );

	it( 'should handle multiple entry points', () => {
		const entryPoints = {
			'editors/post': './js/src/editors/post/index.js',
			'editors/site': './js/src/editors/site/index.js',
			'editors/widget': './js/src/editors/widget/index.js',
			blocks: './js/src/blocks/index.js',
			'integrations/acf': './integrations/ACF/js/index.js',
		};

		const configs = getReactifiedConfig( {
			...baseOptions,
			entryPoints,
		} );

		configs.forEach( ( config ) => {
			expect( config.entry ).toEqual( entryPoints );
		} );
	} );
} );
