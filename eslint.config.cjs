const wpPlugin = require( '@wordpress/eslint-plugin' );

module.exports = [
	{
		ignores: [ '**/node_modules/**', 'coverage/**' ],
	},
	...wpPlugin.configs.recommended,
	...wpPlugin.configs[ 'test-unit' ].map( ( config ) => ( {
		...config,
		files: [ '**/*.test.js' ],
	} ) ),
];
