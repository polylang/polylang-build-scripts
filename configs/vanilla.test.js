// Mock glob to avoid file system dependencies
jest.mock( 'glob', () => ( {
	sync: jest.fn(),
} ) );

// Mock transformers to avoid dependency issues
jest.mock( '../main', () => {
	const mockPath = require( 'path' );

	return {
		transformJsEntry: jest.fn( ( destination, minimize ) => {
			return ( filename ) => ( {
				entry: { [ mockPath.parse( filename ).name ]: filename },
				output: {
					filename: `${ mockPath.parse( filename ).name }${
						minimize ? '.min' : ''
					}.js`,
					path: destination,
				},
				optimization: {
					minimize,
					minimizer: minimize ? [ {} ] : undefined,
				},
			} );
		} ),
		transformCssEntry: jest.fn( ( destination, isProduction ) => {
			return ( filename ) => ( {
				entry: { [ mockPath.parse( filename ).name ]: filename },
				output: {
					filename: '[name].work',
					path: destination,
				},
				devtool: ! isProduction ? 'source-map' : false,
			} );
		} ),
	};
} );

const glob = require( 'glob' );

/**
 * Internal dependencies
 */
const { getVanillaConfig } = require( './vanilla' );

describe( 'getVanillaConfig', () => {
	const testWorkingDirectory = '/test/project';
	const jsBuildDirectory = '/test/project/js/build';
	const cssBuildDirectory = '/test/project/css/build';

	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should return an array of webpack configurations', () => {
		glob.sync.mockReturnValue( [] );

		const configs = getVanillaConfig( {
			workingDirectory: testWorkingDirectory,
			jsBuildDirectory,
			cssBuildDirectory,
			isProduction: true,
		} );

		expect( configs ).toBeInstanceOf( Array );
	} );

	it( 'should use default patterns when not provided', () => {
		glob.sync.mockReturnValue( [] );

		getVanillaConfig( {
			workingDirectory: testWorkingDirectory,
			jsBuildDirectory,
			cssBuildDirectory,
			isProduction: true,
		} );

		expect( glob.sync ).toHaveBeenCalledWith( '**/*.js', {
			cwd: testWorkingDirectory,
			ignore: [],
		} );
		expect( glob.sync ).toHaveBeenCalledWith( '**/*.css', {
			cwd: testWorkingDirectory,
			ignore: [],
		} );
	} );

	it( 'should use custom JS patterns when provided', () => {
		glob.sync.mockReturnValue( [] );

		const customJsPatterns = [ 'src/**/*.js', 'lib/**/*.js' ];

		getVanillaConfig( {
			workingDirectory: testWorkingDirectory,
			jsPatterns: customJsPatterns,
			jsBuildDirectory,
			cssBuildDirectory,
			isProduction: true,
		} );

		expect( glob.sync ).toHaveBeenCalledWith( 'src/**/*.js', {
			cwd: testWorkingDirectory,
			ignore: [],
		} );
		expect( glob.sync ).toHaveBeenCalledWith( 'lib/**/*.js', {
			cwd: testWorkingDirectory,
			ignore: [],
		} );
	} );

	it( 'should use custom CSS patterns when provided', () => {
		glob.sync.mockReturnValue( [] );

		const customCssPatterns = [ 'styles/**/*.css', 'themes/**/*.css' ];

		getVanillaConfig( {
			workingDirectory: testWorkingDirectory,
			cssPatterns: customCssPatterns,
			jsBuildDirectory,
			cssBuildDirectory,
			isProduction: true,
		} );

		expect( glob.sync ).toHaveBeenCalledWith( 'styles/**/*.css', {
			cwd: testWorkingDirectory,
			ignore: [],
		} );
		expect( glob.sync ).toHaveBeenCalledWith( 'themes/**/*.css', {
			cwd: testWorkingDirectory,
			ignore: [],
		} );
	} );

	it( 'should pass ignore patterns to glob for JS files', () => {
		glob.sync.mockReturnValue( [] );

		const jsIgnorePatterns = [
			'node_modules/**',
			'**/*.min.js',
			'**/build/**',
		];

		getVanillaConfig( {
			workingDirectory: testWorkingDirectory,
			jsIgnorePatterns,
			jsBuildDirectory,
			cssBuildDirectory,
			isProduction: true,
		} );

		expect( glob.sync ).toHaveBeenCalledWith( '**/*.js', {
			cwd: testWorkingDirectory,
			ignore: jsIgnorePatterns,
		} );
	} );

	it( 'should pass ignore patterns to glob for CSS files', () => {
		glob.sync.mockReturnValue( [] );

		const cssIgnorePatterns = [ 'node_modules/**', '**/*.min.css' ];

		getVanillaConfig( {
			workingDirectory: testWorkingDirectory,
			cssIgnorePatterns,
			jsBuildDirectory,
			cssBuildDirectory,
			isProduction: true,
		} );

		expect( glob.sync ).toHaveBeenCalledWith( '**/*.css', {
			cwd: testWorkingDirectory,
			ignore: cssIgnorePatterns,
		} );
	} );

	it( 'should create both minified and unminified configs for JS files', () => {
		glob.sync.mockImplementation( ( pattern ) => {
			if ( pattern === '**/*.js' ) {
				return [ 'admin/settings.js', 'frontend/main.js' ];
			}

			return [];
		} );

		const configs = getVanillaConfig( {
			workingDirectory: testWorkingDirectory,
			jsBuildDirectory,
			cssBuildDirectory,
			isProduction: true,
		} );

		// Should have 2 files * 2 (minified + unminified) = 4 JS configs
		const jsConfigs = configs.filter( ( config ) =>
			config.output.filename.endsWith( '.js' )
		);
		expect( jsConfigs ).toHaveLength( 4 );

		// Check for both minified and unminified versions
		const minifiedJsConfigs = jsConfigs.filter( ( config ) =>
			config.output.filename.includes( '.min.js' )
		);
		const unminifiedJsConfigs = jsConfigs.filter(
			( config ) =>
				config.output.filename.endsWith( '.js' ) &&
				! config.output.filename.includes( '.min' )
		);

		expect( minifiedJsConfigs ).toHaveLength( 2 );
		expect( unminifiedJsConfigs ).toHaveLength( 2 );
	} );

	it( 'should create CSS configs with proper settings', () => {
		glob.sync.mockImplementation( ( pattern ) => {
			if ( pattern === '**/*.css' ) {
				return [ 'admin/style.css', 'frontend/style.css' ];
			}

			return [];
		} );

		const configs = getVanillaConfig( {
			workingDirectory: testWorkingDirectory,
			jsBuildDirectory,
			cssBuildDirectory,
			isProduction: true,
		} );

		const cssConfigs = configs.filter(
			( config ) => config.output.filename === '[name].work'
		);
		expect( cssConfigs ).toHaveLength( 2 );

		// Check CSS configs have correct output path
		cssConfigs.forEach( ( config ) => {
			expect( config.output.path ).toBe( cssBuildDirectory );
		} );
	} );

	it( 'should prepend ./ to file names found by glob', () => {
		glob.sync.mockImplementation( ( pattern ) => {
			if ( pattern === '**/*.js' ) {
				return [ 'admin/settings.js' ];
			}

			return [];
		} );

		const configs = getVanillaConfig( {
			workingDirectory: testWorkingDirectory,
			jsBuildDirectory,
			cssBuildDirectory,
			isProduction: true,
		} );

		const jsConfig = configs.find( ( config ) => config.entry.settings );
		expect( jsConfig ).toBeDefined();
		expect( jsConfig.entry.settings ).toBe( './admin/settings.js' );
	} );

	it( 'should handle multiple patterns for JS files', () => {
		glob.sync.mockImplementation( ( pattern ) => {
			if ( pattern === 'admin/**/*.js' ) {
				return [ 'admin/settings.js' ];
			}
			if ( pattern === 'frontend/**/*.js' ) {
				return [ 'frontend/main.js' ];
			}

			return [];
		} );

		const configs = getVanillaConfig( {
			workingDirectory: testWorkingDirectory,
			jsPatterns: [ 'admin/**/*.js', 'frontend/**/*.js' ],
			jsBuildDirectory,
			cssBuildDirectory,
			isProduction: true,
		} );

		// Should have 2 files * 2 (minified + unminified) = 4 JS configs
		const jsConfigs = configs.filter( ( config ) =>
			config.output.filename.endsWith( '.js' )
		);
		expect( jsConfigs ).toHaveLength( 4 );
	} );

	it( 'should handle multiple patterns for CSS files', () => {
		glob.sync.mockImplementation( ( pattern ) => {
			if ( pattern === 'admin/**/*.css' ) {
				return [ 'admin/style.css' ];
			}
			if ( pattern === 'frontend/**/*.css' ) {
				return [ 'frontend/style.css' ];
			}

			return [];
		} );

		const configs = getVanillaConfig( {
			workingDirectory: testWorkingDirectory,
			cssPatterns: [ 'admin/**/*.css', 'frontend/**/*.css' ],
			jsBuildDirectory,
			cssBuildDirectory,
			isProduction: true,
		} );

		const cssConfigs = configs.filter(
			( config ) => config.output.filename === '[name].work'
		);
		expect( cssConfigs ).toHaveLength( 2 );
	} );

	it( 'should pass isProduction flag to CSS transformer', () => {
		glob.sync.mockImplementation( ( pattern ) => {
			if ( pattern === '**/*.css' ) {
				return [ 'style.css' ];
			}

			return [];
		} );

		const prodConfig = getVanillaConfig( {
			workingDirectory: testWorkingDirectory,
			jsBuildDirectory,
			cssBuildDirectory,
			isProduction: true,
		} );

		const devConfig = getVanillaConfig( {
			workingDirectory: testWorkingDirectory,
			jsBuildDirectory,
			cssBuildDirectory,
			isProduction: false,
		} );

		// Check devtool setting (source maps enabled in dev mode)
		const prodCssConfig = prodConfig.find(
			( config ) => config.output.filename === '[name].work'
		);
		const devCssConfig = devConfig.find(
			( config ) => config.output.filename === '[name].work'
		);

		expect( prodCssConfig.devtool ).toBe( false );
		expect( devCssConfig.devtool ).toBe( 'source-map' );
	} );

	it( 'should use correct build directories', () => {
		glob.sync.mockImplementation( ( pattern ) => {
			if ( pattern === '**/*.js' ) {
				return [ 'admin.js' ];
			}
			if ( pattern === '**/*.css' ) {
				return [ 'style.css' ];
			}

			return [];
		} );

		const customJsDir = '/custom/js/build';
		const customCssDir = '/custom/css/build';

		const configs = getVanillaConfig( {
			workingDirectory: testWorkingDirectory,
			jsBuildDirectory: customJsDir,
			cssBuildDirectory: customCssDir,
			isProduction: true,
		} );

		const jsConfig = configs.find( ( config ) => config.entry.admin );
		const cssConfig = configs.find(
			( config ) => config.output.filename === '[name].work'
		);

		expect( jsConfig.output.path ).toBe( customJsDir );
		expect( cssConfig.output.path ).toBe( customCssDir );
	} );

	it( 'should handle empty file lists gracefully', () => {
		glob.sync.mockReturnValue( [] );

		const configs = getVanillaConfig( {
			workingDirectory: testWorkingDirectory,
			jsBuildDirectory,
			cssBuildDirectory,
			isProduction: true,
		} );

		expect( configs ).toEqual( [] );
	} );

	it( 'should set correct output filenames for JS configs', () => {
		glob.sync.mockImplementation( ( pattern ) => {
			if ( pattern === '**/*.js' ) {
				return [ 'admin/settings.js' ];
			}

			return [];
		} );

		const configs = getVanillaConfig( {
			workingDirectory: testWorkingDirectory,
			jsBuildDirectory,
			cssBuildDirectory,
			isProduction: true,
		} );

		const minifiedConfig = configs.find(
			( config ) =>
				config.entry.settings &&
				config.output.filename === 'settings.min.js'
		);
		const unminifiedConfig = configs.find(
			( config ) =>
				config.entry.settings &&
				config.output.filename === 'settings.js'
		);

		expect( minifiedConfig ).toBeDefined();
		expect( minifiedConfig.optimization.minimize ).toBe( true );

		expect( unminifiedConfig ).toBeDefined();
		expect( unminifiedConfig.optimization.minimize ).toBe( false );
	} );

	it( 'should configure optimization for minified JS files', () => {
		glob.sync.mockImplementation( ( pattern ) => {
			if ( pattern === '**/*.js' ) {
				return [ 'main.js' ];
			}

			return [];
		} );

		const configs = getVanillaConfig( {
			workingDirectory: testWorkingDirectory,
			jsBuildDirectory,
			cssBuildDirectory,
			isProduction: true,
		} );

		const minifiedConfig = configs.find(
			( config ) =>
				config.entry.main && config.output.filename === 'main.min.js'
		);

		expect( minifiedConfig.optimization.minimize ).toBe( true );
		expect( minifiedConfig.optimization.minimizer ).toHaveLength( 1 );
	} );
} );
