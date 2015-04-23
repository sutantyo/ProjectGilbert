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


	// Chart related jquery 
	//
	
	// populating the select boxes with options
	//
	available_dates.forEach(function(period){
		$('#chart-input-start-month').append('<option value = "' + period.month + '">' + period.month + '</option>'); 
		$('#chart-input-end-month').append('<option value = "' + period.month + '">' + period.month + '</option>'); 
	});
	//$('#chart-input-start-day').attr('disabled','disabled');

	for (var i = available_dates[0].min_date; i <= available_dates[0].max_date; i++)
	{
		$('#chart-input-start-day').append('<option value = "' + i + '">' + i + '</option>'); 
		$('#chart-input-end-day').append('<option value = "' + i + '">' + i + '</option>'); 
	}

	available_times.forEach(function(period){
		$('#chart-input-start-time').append('<option value = "' + period + '">' + period + '</option>'); 
		
		$('#chart-input-end-time').append('<option value = "' + period + '">' + period + '</option>'); 
	});
		$('#chart-input-start-time').val('10:00');
		$('#chart-input-start-time').selectpicker('render');
		$('#chart-input-end-time').val('13:00');
		$('#chart-input-end-time').selectpicker('render');


	$('#chart-input-start-month').change(function(){
		var _this = $(this);
		available_dates.forEach(function(dates){
			if (dates.month === _this.val())
			{
				$('#chart-input-start-day').empty();
				for(var i = dates.min_date; i <= dates.max_date; i++)
				{
					$('#chart-input-start-day').append('<option value = "' + i + '">' + i + '</option>'); 
				}
				$('#chart-input-start-day').selectpicker('refresh');
			}
		});
	});

	$('#chart-input-end-month').change(function(){
		var _this = $(this);
		available_dates.forEach(function(dates){
			if (dates.month === _this.val())
			{
				$('#chart-input-end-day').empty();
				for(var i = dates.min_date; i <= dates.max_date; i++)
				{
					$('#chart-input-end-day').append('<option value = "' + i + '">' + i + '</option>'); 
				}
				$('#chart-input-end-day').selectpicker('refresh');
			}
		});
	});



	$('#generate-button').click(function(){

		console.log("GENERATING...");
		var UTC_start_time = ($('#chart-input-start-day').val() + ' ' + $('#chart-input-start-month').val() + ' ' + available_year
											+ ' ' + $('#chart-input-start-time').val() + ' UTC');
		UTC_start_time = new Date(UTC_start_time);
		var UTC_end_time = ($('#chart-input-end-day').val() + ' ' + $('#chart-input-end-month').val() + ' ' + available_year
											+ ' ' + $('#chart-input-end-time').val() + ' UTC');
		UTC_end_time = new Date(UTC_end_time);

		coverageRadius = $('#chart-input-radius').val();	
		if (UTC_end_time <= UTC_start_time)
			alert("Start time is greater than or equal to end time");
		else
		{
			console.log(UTC_start_time.getTime()/1000 + ' to ' + UTC_end_time.getTime()/1000);
			chart_div.select('svg').remove();
			chart_svg = chart_div.append('svg')
					.attr('height',400)
					.attr('width',1800)
			chartDrawer(UTC_start_time.getTime()/1000,UTC_end_time.getTime()/1000, $('#chart-input-type').val(), 60);
		}
		/*
			Call draw from 
				UTC_start_time.getTime()/1000;
				to
				UTC_end_time.getTime()/1000;
				
				$('chart-input-type').val();	
				$('chart-input-interval').val();	
				$('chart-input-radius').val();	
		*/
	});

	$('#chart-input-type').change(function(){
	});
	
	$('#chart-input-radius').change(function(){
		console.log('radius changed');
	});
});
