# Polylang Build Scripts

Webpack configuration helpers for building Polylang projects. Provides two main functions for generating webpack configs: `getVanillaConfig` for vanilla JS/CSS files and `getReactifiedConfig` for React-based builds.

## Installation

```bash
npm install @wpsyntex/polylang-build-scripts
```

## getVanillaConfig

Generates webpack configurations for vanilla JS and CSS files. Creates both minified and unminified versions.

**Required options:**
- `workingDirectory` - Working directory for glob resolution (typically `__dirname`)
- `jsBuildDirectory` - Output directory for JS files
- `cssBuildDirectory` - Output directory for CSS files
- `isProduction` - Enable production mode optimizations

**Optional options:**
- `jsPatterns` - Glob patterns for JS files (default: `['**/*.js']`)
- `jsIgnorePatterns` - Patterns to ignore for JS files (default: `[]`)
- `cssPatterns` - Glob patterns for CSS files (default: `['**/*.css']`)
- `cssIgnorePatterns` - Patterns to ignore for CSS files (default: `[]`)

**Example:**

```javascript
const { getVanillaConfig } = require( '@wpsyntex/polylang-build-scripts' );

const vanillaConfigs = getVanillaConfig( {
	workingDirectory: __dirname,
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