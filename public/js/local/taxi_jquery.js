$(document).ready(function(){

	available_dates.forEach(function(period){
		$('.start-month').append('<option value = "' + period.month + '">' + period.month + '</option>'); 
		$('.end-month').append('<option value = "' + period.month + '">' + period.month + '</option>'); 
	});

	/* THIS IS BRITTLE */
	for (var i = available_dates[0].min_date; i <= available_dates[0].max_date; i++)
	{
		$('.start-day').append('<option value = "' + i + '">' + i + '</option>'); 
		$('.end-day').append('<option value = "' + i + '">' + i + '</option>'); 
	}

	available_times.forEach(function(period){
		$('.start-time').append('<option value = "' + period + '">' + period + '</option>'); 
		$('.end-time').append('<option value = "' + period + '">' + period + '</option>'); 
	});
	
	// Set default values
	$('.start-time').val('07:00');
	$('.start-time').selectpicker('render');
	$('.end-time').val('08:00');
	$('.end-time').selectpicker('render');
	$('.start-day').val('20');
	$('.start-day').selectpicker('render');
	$('.end-day').val('20');
	$('.end-day').selectpicker('render');
	$('.default-sw-coord-x').val(map_boundaries[3].x);
	$('.default-sw-coord-y').val(map_boundaries[3].y);
	$('.default-ne-coord-x').val(map_boundaries[1].x);
	$('.default-ne-coord-y').val(map_boundaries[1].y)

	recommended_intervals.forEach(function(interval){
		$('.input-interval').append('<option value = "' + interval + '">' + interval + '</option>'); 
	});

	

});// end jquery




