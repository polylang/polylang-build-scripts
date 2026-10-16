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

By default (`strategy: 'per-file'`), each source file gets its own webpack config per variant. With many files, webpack-cli runs them all in parallel via MultiCompiler, which increases peak memory and build time. Use `strategy: 'bundled'` to emit up to four configs total (JS min/unmin + CSS min/unmin) with multi-entry builds — recommended for projects with more than a handful of vanilla assets. Invalid `strategy` values throw at config generation time. Glob matches are deduplicated (stable order) before entries are built.

**Required options:**
- `workingDirectory` - Working directory for glob resolution (typically `__dirname`)
- `jsBuildDirectory` - Output directory for JS files
- `cssBuildDirectory` - Output directory for CSS files
- `isProduction` - Enable production mode optimizations

**Optional options:**
- `strategy` - `'per-file'` (default, backward compatible) or `'bundled'` (one config per asset type and variant)
- `entryKey` - When `strategy` is `'bundled'`: `'relative'` (default, nested output paths under the build directory) or `'basename'` (flat output names matching the legacy per-file layout, e.g. `js/src/settings.js` → `js/build/settings.min.js`)
- `jsPatterns` - Glob patterns for JS files (default: `['**/*.js']`)
- `jsIgnorePatterns` - Patterns to ignore for JS files (default: `[]`)
- `cssPatterns` - Glob patterns for CSS files (default: `['**/*.css']`)
- `cssIgnorePatterns` - Patterns to ignore for CSS files (default: `[]`)

**Entry naming**

| Mode | Option | Entry key example | Output example |
|------|--------|-------------------|----------------|
| Per-file (default) | — | `settings` from any path | `js/build/settings.min.js` (basename only; collisions possible) |
| Bundled | `entryKey: 'relative'` | `modules/admin/settings` | `js/build/modules/admin/settings.min.js` |
| Bundled | `entryKey: 'basename'` | `settings` | `js/build/settings.min.js` (same flat layout as per-file) |

With `entryKey: 'basename'`, two sources that share a basename (e.g. `admin/settings.js` and `frontend/settings.js`) throw a clear error when configs are generated — entries are not silently overwritten.

Bundled configs disable code splitting (`splitChunks` / `runtimeChunk`) so each entry stays a single output file even when entries share local imports.

**Polylang Pro (flat public URLs, bundled builds):**

```javascript
const vanillaConfigs = getVanillaConfig( {
	workingDirectory: __dirname,
	strategy: 'bundled',
	entryKey: 'basename',
	jsPatterns: [ 'js/src/**/*.js' ],
	jsIgnorePatterns: [ '**/*.min.js' ],
	cssPatterns: [ 'css/src/**/*.css' ],
	jsBuildDirectory: path.resolve( __dirname, 'js/build' ),
	cssBuildDirectory: path.resolve( __dirname, 'css/build' ),
	isProduction: mode === 'production',
} );
```

**Glob scoping:** Keep `jsPatterns`, `cssPatterns`, and ignore lists tight so build scripts only pick up intended sources (for example, exclude `vendor/**/tmp/**`).

**Nested outputs (bundled + relative keys):**

```javascript
const { getVanillaConfig } = require( '@wpsyntex/polylang-build-scripts' );

const vanillaConfigs = getVanillaConfig( {
	workingDirectory: __dirname,
	strategy: 'bundled',
	entryKey: 'relative',
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

Runs an array of webpack configs with optional concurrency limiting. Useful when combining many configs (for example, legacy per-file vanilla plus reactified builds) without letting webpack-cli spawn unbounded parallel compilations. Rejects with `TypeError` when `configs` is not an array or when `concurrency` is invalid. Fails fast on the first compilation error.

Vanilla CSS builds use distinct intermediate filenames for minified (`[name].min.work`) and unminified (`[name].unmin.work`) variants, with cleanup scoped to the CSS output directory. Min and unmin configs are therefore safe to run in parallel (for example `runWebpackConfigs( vanillaConfigs, { concurrency: 4 } )`). This applies to both `per-file` and `bundled` strategies (per-file previously cleaned `*.work` from `process.cwd()`, which is now aligned with the output directory).

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