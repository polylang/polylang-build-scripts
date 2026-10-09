# Polylang Build Scripts

Webpack configuration helpers for building Polylang projects. Provides two main functions for generating webpack configs: `getVanillaConfig` for vanilla JS/CSS files and `getReactifiedConfig` for React-based builds.

## Installation

```bash
npm install @wpsyntex/polylang-build-scripts
```

Install the peer dependencies in the consumer project (versions below are the minimum supported):

```bash
npm install -D clean-webpack-plugin css-loader css-minimizer-webpack-plugin glob mini-css-extract-plugin terser-webpack-plugin webpack webpack-cli
```

Add `sass` and `sass-loader` when using `getReactifiedConfig` with `sassLoadPaths`.

## getVanillaConfig

Generates webpack configurations for vanilla JS and CSS files. Creates both minified and unminified versions.

By default (`strategy: 'per-file'`), each source file gets its own webpack config per variant. With many files, webpack-cli runs them all in parallel via MultiCompiler, which increases peak memory and build time. Use `strategy: 'bundled'` to emit four configs total (JS min/unmin + CSS min/unmin) with multi-entry builds — recommended for projects with more than a handful of vanilla assets.

**Required options:**
- `workingDirectory` - Working directory for glob resolution (typically `__dirname`)
- `jsBuildDirectory` - Output directory for JS files
- `cssBuildDirectory` - Output directory for CSS files
- `isProduction` - Enable production mode optimizations

**Optional options:**
- `strategy` - `'per-file'` (default, backward compatible) or `'bundled'` (one config per asset type and variant)
- `jsPatterns` - Glob patterns for JS files (default: `['**/*.js']`)
- `jsIgnorePatterns` - Patterns to ignore for JS files (default: `[]`)
- `cssPatterns` - Glob patterns for CSS files (default: `['**/*.css']`)
- `cssIgnorePatterns` - Patterns to ignore for CSS files (default: `[]`)

**Entry naming:** The legacy `per-file` strategy uses the file basename as the webpack entry key (`settings.js` → `settings`), so two files with the same name in different directories will collide. The `bundled` strategy uses stable relative keys (`./modules/admin/settings.js` → `modules/admin/settings`) and writes nested output paths (`modules/admin/settings.min.js`).

**Glob scoping:** Keep `jsPatterns`, `cssPatterns`, and ignore lists tight so build scripts only pick up intended sources (for example, exclude `vendor/**/tmp/**`).

**Example:**

```javascript
const { getVanillaConfig } = require( '@wpsyntex/polylang-build-scripts' );

const vanillaConfigs = getVanillaConfig( {
	workingDirectory: __dirname,
	strategy: 'bundled',
	jsPatterns: [ '**/*.js' ],
	jsIgnorePatterns: [ 'node_modules/**', '**/build/**', '**/*.min.js' ],
	cssPatterns: [ '**/*.css' ],
	cssIgnorePatterns: [ 'node_modules/**', '**/build/**', '**/*.min.css' ],
	jsBuildDirectory: path.resolve( __dirname, 'js/build' ),
	cssBuildDirectory: path.resolve( __dirname, 'css/build' ),
	isProduction: mode === 'production',
} );

module.exports = vanillaConfigs;
```

## getReactifiedConfig

Generates webpack configurations for React-based builds (blocks, editors). Creates minified and unminified builds with Babel transpilation.

**Required options:**
- `entryPoints` - Entry points for webpack (e.g., `{ blocks: './js/src/blocks/index.js' }`)
- `outputPath` - Base path for output files (typically `__dirname`)
- `libraryName` - Library name for the bundle (e.g., `'polylang'`)
- `isProduction` - Enable production mode optimizations
- `wpDependencies` - WordPress package dependencies to mark as externals (e.g., `['blocks', 'element', 'i18n']`)

**Optional options:**
- `additionalExternals` - Additional external dependencies (e.g., `{ jquery: 'jQuery' }`)

**Example:**

```javascript
const { getReactifiedConfig } = require( '@wpsyntex/polylang-build-scripts' );

const wpDependencies = [
	'api-fetch',
	'block-editor',
	'blocks',
	'components',
	'data',
	'element',
	'i18n',
];

const reactConfigs = getReactifiedConfig( {
	entryPoints: { blocks: './js/src/blocks/index.js' },
	outputPath: __dirname,
	libraryName: 'polylang',
	isProduction: mode === 'production',
	wpDependencies,
} );

module.exports = reactConfigs;
```

## runWebpackConfigs

Runs an array of webpack configs with optional concurrency limiting. Useful when combining many configs (for example, legacy per-file vanilla plus reactified builds) without letting webpack-cli spawn unbounded parallel compilations.

```javascript
const { runWebpackConfigs } = require( '@wpsyntex/polylang-build-scripts' );

const configs = [
	...getVanillaConfig( { /* options */ } ),
	...getReactifiedConfig( { /* options */ } ),
];

runWebpackConfigs( configs, { concurrency: 2 } )
	.then( () => console.log( 'Build complete' ) )
	.catch( ( error ) => {
		console.error( error );
		process.exit( 1 );
	} );
```

## Combined Usage

```javascript
const { getVanillaConfig, getReactifiedConfig } = require( '@wpsyntex/polylang-build-scripts' );

module.exports = ( env, argv ) => {
	const mode = argv.mode || 'development';
	const isProduction = mode === 'production';

	return [
		...getVanillaConfig( { /* options */ } ),
		...getReactifiedConfig( { /* options */ } ),
	];
};
```

---

These scripts are meant to be used as dependencies of Polylang-related projects but can easily be adapted for any WordPress project requiring JS or React build tools.