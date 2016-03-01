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

	// set recommended values
	$('.start-day').val(recommended_start_day);
	$('.start-day').selectpicker('render');
	$('.start-month').val(recommended_start_month);
	$('.start-month').selectpicker('render');
	$('.start-time').val(recommended_start_hour);
	$('.start-time').selectpicker('render');

	$('.end-day').val(recommended_end_day);
	$('.end-day').selectpicker('render');
	$('.end-month').val(recommended_end_month);
	$('.end-month').selectpicker('render');
	$('.end-time').val(recommended_end_hour);
	$('.end-time').selectpicker('render');

	$('.default-sw-coord-x').val(map_boundaries[3].x);
	$('.default-sw-coord-y').val(map_boundaries[3].y);
	$('.default-ne-coord-x').val(map_boundaries[1].x);
	$('.default-ne-coord-y').val(map_boundaries[1].y)

	available_intervals.forEach(function(interval){
		$('.input-interval').append('<option value = "' + interval + '">' + interval + '</option>');
	});

	$('.input-interval').val(recommended_interval);
	$('.input-interval').selectpicker('render');

	$('.input-radius').val(recommended_radius);

});// end jquery
