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

	describe( 'SASS processing', () => {
		it( 'should not include SASS rules when sassLoadPaths is empty', () => {
			const configs = getReactifiedConfig( baseOptions );

			configs.forEach( ( config ) => {
				const sassRule = config.module.rules.find(
					( rule ) =>
						rule.test &&
						rule.test.toString() === /\.s?css$/.toString()
				);

				expect( sassRule ).toBeUndefined();
			} );
		} );

		it( 'should include SASS rules when sassLoadPaths is provided', () => {
			const entryPoints = {
				blocks: './js/src/blocks/index.js',
				styles: './css/src/styles.scss',
			};

			const configs = getReactifiedConfig( {
				...baseOptions,
				entryPoints,
				sassLoadPaths: [ './css/src' ],
			} );

			configs.forEach( ( config ) => {
				const sassRule = config.module.rules.find(
					( rule ) =>
						rule.test &&
						rule.test.toString() === /\.s?css$/.toString()
				);

				expect( sassRule ).toBeDefined();
				expect( sassRule.use ).toHaveLength( 3 );
			} );
		} );

		it( 'should not include SASS rules when sassLoadPaths not provided even with SASS entry points', () => {
			const entryPoints = {
				blocks: './js/src/blocks/index.js',
				styles: './css/src/styles.scss',
			};

			const configs = getReactifiedConfig( {
				...baseOptions,
				entryPoints,
			} );

			configs.forEach( ( config ) => {
				const sassRule = config.module.rules.find(
					( rule ) =>
						rule.test &&
						rule.test.toString() === /\.s?css$/.toString()
				);

				expect( sassRule ).toBeUndefined();
			} );
		} );

		it( 'should pass sassLoadPaths to SASS loader options', () => {
			const entryPoints = {
				blocks: './js/src/blocks/index.js',
				styles: './css/src/styles.scss',
			};

			const sassLoadPaths = [
				'/test/path/components',
				'/test/path/utilities',
			];

			const configs = getReactifiedConfig( {
				...baseOptions,
				entryPoints,
				sassLoadPaths,
			} );

			configs.forEach( ( config ) => {
				const sassRule = config.module.rules.find(
					( rule ) =>
						rule.test &&
						rule.test.toString() === /\.s?css$/.toString()
				);

				expect( sassRule ).toBeDefined();

				const sassLoader = sassRule.use.find(
					( loader ) =>
						typeof loader === 'object' &&
						loader.loader === 'sass-loader'
				);

				expect( sassLoader ).toBeDefined();
				expect( sassLoader.options.sassOptions.loadPaths ).toEqual(
					sassLoadPaths
				);
			} );
		} );

		it( 'should keep all entry points including SASS files when sassLoadPaths provided', () => {
			const entryPoints = {
				blocks: './js/src/blocks/index.js',
				styles: './css/src/styles.scss',
			};

			const configs = getReactifiedConfig( {
				...baseOptions,
				entryPoints,
				sassLoadPaths: [ './css/src' ],
			} );

			configs.forEach( ( config ) => {
				expect( config.entry ).toEqual( entryPoints );
			} );
		} );

		it( 'should use provided sassLoadPaths with multiple paths', () => {
			const entryPoints = {
				blocks: './js/src/blocks/index.js',
				editorStyles: './css/src/editor/main.scss',
			};

			const sassLoadPaths = [
				'./css/src/editor',
				'./css/src/blocks',
				'./css/src/components',
			];

			const configs = getReactifiedConfig( {
				...baseOptions,
				entryPoints,
				sassLoadPaths,
			} );

			configs.forEach( ( config ) => {
				const sassRule = config.module.rules.find(
					( rule ) =>
						rule.test &&
						rule.test.toString() === /\.s?css$/.toString()
				);

				const sassLoader = sassRule.use.find(
					( loader ) =>
						typeof loader === 'object' &&
						loader.loader === 'sass-loader'
				);

				expect( sassLoader.options.sassOptions.loadPaths ).toEqual(
					sassLoadPaths
				);
			} );
		} );

		it( 'should configure compressed outputStyle for minified config', () => {
			const entryPoints = {
				styles: './css/src/styles.scss',
			};

			const configs = getReactifiedConfig( {
				...baseOptions,
				entryPoints,
				sassLoadPaths: [ './css/src' ],
			} );

			const [ minified ] = configs;
			const sassRule = minified.module.rules.find(
				( rule ) =>
					rule.test && rule.test.toString() === /\.s?css$/.toString()
			);

			const sassLoader = sassRule.use.find(
				( loader ) =>
					typeof loader === 'object' &&
					loader.loader === 'sass-loader'
			);

			expect( sassLoader.options.sassOptions.outputStyle ).toBe(
				'compressed'
			);
		} );

		it( 'should configure expanded outputStyle for unminified config', () => {
			const entryPoints = {
				styles: './css/src/styles.scss',
			};

			const configs = getReactifiedConfig( {
				...baseOptions,
				entryPoints,
				sassLoadPaths: [ './css/src' ],
			} );

			const [ , unminified ] = configs;
			const sassRule = unminified.module.rules.find(
				( rule ) =>
					rule.test && rule.test.toString() === /\.s?css$/.toString()
			);

			const sassLoader = sassRule.use.find(
				( loader ) =>
					typeof loader === 'object' &&
					loader.loader === 'sass-loader'
			);

			expect( sassLoader.options.sassOptions.outputStyle ).toBe(
				'expanded'
			);
		} );

		it( 'should enable source maps in SASS loader when not in production', () => {
			const entryPoints = {
				styles: './css/src/styles.scss',
			};

			const configs = getReactifiedConfig( {
				...baseOptions,
				entryPoints,
				sassLoadPaths: [ './css/src' ],
				isProduction: false,
			} );

			configs.forEach( ( config ) => {
				const sassRule = config.module.rules.find(
					( rule ) =>
						rule.test &&
						rule.test.toString() === /\.s?css$/.toString()
				);

				const sassLoader = sassRule.use.find(
					( loader ) =>
						typeof loader === 'object' &&
						loader.loader === 'sass-loader'
				);

				expect( sassLoader.options.sassOptions.sourceMap ).toBe( true );
			} );
		} );

		it( 'should disable source maps in SASS loader when in production', () => {
			const entryPoints = {
				styles: './css/src/styles.scss',
			};

			const configs = getReactifiedConfig( {
				...baseOptions,
				entryPoints,
				sassLoadPaths: [ './css/src' ],
				isProduction: true,
			} );

			configs.forEach( ( config ) => {
				const sassRule = config.module.rules.find(
					( rule ) =>
						rule.test &&
						rule.test.toString() === /\.s?css$/.toString()
				);

				const sassLoader = sassRule.use.find(
					( loader ) =>
						typeof loader === 'object' &&
						loader.loader === 'sass-loader'
				);

				expect( sassLoader.options.sassOptions.sourceMap ).toBe(
					false
				);
			} );
		} );

		it( 'should handle mixed array and string entry points with custom loadPaths', () => {
			const entryPoints = {
				blocks: [ './css/src/blocks.scss', './js/src/blocks/index.js' ],
				editor: './js/src/editor/index.js',
				theme: './css/src/theme.scss',
			};

			const sassLoadPaths = [ './css/src' ];

			const configs = getReactifiedConfig( {
				...baseOptions,
				entryPoints,
				sassLoadPaths,
			} );

			configs.forEach( ( config ) => {
				const sassRule = config.module.rules.find(
					( rule ) =>
						rule.test &&
						rule.test.toString() === /\.s?css$/.toString()
				);

				const sassLoader = sassRule.use.find(
					( loader ) =>
						typeof loader === 'object' &&
						loader.loader === 'sass-loader'
				);

				expect( sassLoader.options.sassOptions.loadPaths ).toEqual(
					sassLoadPaths
				);

				// Verify entry points are kept as-is
				expect( config.entry ).toEqual( entryPoints );
			} );
		} );
	} );
} );
