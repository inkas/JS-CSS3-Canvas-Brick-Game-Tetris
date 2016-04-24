(function(){
	'use strict';
	
	require.config({
		paths: {
			modernizr: 'lib/modernizr-custom',
			webfontloader: 'lib/webfontloader',
			Tetris: 'app/tetris',
			customLibrary: 'app/helpers/custom-library'
		},
		shim: {
			modernizr: {
				exports: 'Modernizr'
			}
		}
	});
	
	requirejs(['app/main']);
})();