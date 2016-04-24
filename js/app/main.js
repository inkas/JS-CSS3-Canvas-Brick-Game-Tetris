define(function(require){
	require(['modernizr'], function(Modernizr){
		if(Modernizr.canvas && Modernizr.audio && Modernizr.es5object){
			require(['Tetris', 'webfontloader'], function(Tetris, WebFont){
				
				var canvas = document.getElementById('screen'),
				tetris = new Tetris(canvas);
			
				tetris.initScreen();
				tetris.init();
				
				WebFont.load({
					custom: {
						families: ['DSDIGI'],
						urls: ['./fonts/font-digi.css']
					},
					fontactive: function(familyName){
						if(familyName == 'DSDIGI'){
							tetris.turnOn();
						}
					}
				});
			});
		}
		else{
			document.getElementById('error-screen-inner').innerHTML = 
				'<p>Your browser is not supported.</p>' +
				'<p>Please update your browser.</p>';
		}
	});
});