$(document).ready(function(){

	$('#start-button').click(function(){
		$('#start-button').hide();
		$('#stop-button').show();
		animationID = setInterval(function(){mainLoop();},framePause)
	});

	$('#stop-button').click(function(){
		$('#stop-button').hide();
		$('#start-button').show();
		window.clearInterval(animationID);
	});
});
