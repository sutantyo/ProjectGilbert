$(document).ready(function(){

	var chart_controller;
	var chart_using_custom_area = false;

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

	$('#chart-input-type').change(function(){
	});
	
	$('#chart-input-radius').change(function(){
	});


	$('#chart-button-custom-area').click(function(){
		var _this = this;
		if ($(_this).hasClass('clicked'))
		{
			chart_using_custom_area = false;
			$(_this).removeClass('clicked');
		}
		else
		{
			chart_using_custom_area = true;
			$(_this).addClass('clicked');
		}

	});


	$('#chart-generate-button').click(function(){


		var custom_area_limits = [];
		if (chart_using_custom_area)
		{ 
			custom_area_limits = { 	x_min: $('#chart-input-sw-coord-x').val(),
															x_max: $('#chart-input-ne-coord-x').val(),
															y_min: $('#chart-input-sw-coord-y').val(),
															y_max: $('#chart-input-ne-coord-y').val() };
		}
		else
		{
			custom_area_limits = { 	x_min: map_boundaries[3].x,
															x_max: map_boundaries[1].x,
															y_min: map_boundaries[3].y,
															y_max: map_boundaries[1].y };
		}

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
			console.log("Generating chart data from " + UTC_start_time + ' to ' + UTC_end_time);
			d3.select('#taxi-data').select('svg').remove();
			generate_taxi_chart(UTC_start_time.getTime()/1000,
													UTC_end_time.getTime()/1000, 
													$('#chart-input-type').val(), 
													$('#chart-input-radius').val(),
													$('#chart-input-interval').val(),
													$('#chart-input-max').val(),
													map_boundaries,
													custom_area_limits)
				.then(function(returned_value){
					returned_value.chart_drawing_loop();
				});
		}
	});


});// end jquery

function generate_taxi_chart(start_time, end_time,
														 type, radius, interval, max_value,
														 boundaries, custom_area_limits)
{

	var svg_height = 400;
	var svg_width = (end_time-start_time)/interval + 200;

	var chart_div = d3.select('#taxi-data');
	var chart_svg = chart_div.append('svg')
		.attr('id','svg-main')
		.attr('height',svg_height)
		.attr('width',svg_width)
	var chart_svg_axis = chart_div.append('svg')
		.attr('id','svg-axis')
		.attr('height',svg_height)
		.attr('width',200)
	
	chart_svg_axis
		.append('rect')
		.attr({ height	: svg_height,
					  width		: '200',
						fill		: 'red',
						opacity	: '0.1'})


	chart_parameters = { chart_start_time : start_time,
											 chart_end_time   : end_time,
											 chart_interval   : parseInt(interval),
											 chart_type				: type,
											 chart_radius     : parseInt(radius),
											 data_url					: data_url,
											 data_chunk_size  : data_chunk_size,
											 data_max_value   : parseInt(max_value),
											 x_min						: parseFloat(custom_area_limits.x_min),
											 x_max						: parseFloat(custom_area_limits.x_max),
											 y_min						: parseFloat(custom_area_limits.y_min),
											 y_max						: parseFloat(custom_area_limits.y_max),
											 svg 							: chart_svg,
											 svg_axis					: chart_svg_axis,
											 svg_height				: svg_height,
											 svg_width				: svg_width 
										 };

	var chart_drawer = new TaxiChartDrawer(chart_parameters);

	return new Promise (function(resolve,reject){
		d3.json(data_url + 'time?start=' + start_time + '&end=' + (start_time+data_chunk_size), function(error,data){
			if (error) reject('Error getting initial data' + error);
			else
			{
				chart_drawer.active_data = data;
				if (start_time+data_chunk_size <= end_time)
				{
					d3.json(data_url + 'time?start=' + (start_time+data_chunk_size) + '&end=' + (start_time+2*data_chunk_size), function(error,data){
						if (error) reject('Error getting initial data' + error);
						else
						{
							chart_drawer.next_set_of_data = data;
							resolve(chart_drawer);
						}
					});
				}
				else
				{
					resolve(chart_drawer);
				}
			}
		});
	});	

}
