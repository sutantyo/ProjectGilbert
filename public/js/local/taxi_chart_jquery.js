$(document).ready(function(){

	var chart_controller;
	var chart_using_custom_area = false;

	$('#chart-input-start-month').change(function()
	{
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
	$('#chart-start-button').click(function(){
		if (chart_controller)
		{
			$('#chart-start-button').hide();
			$('#chart-reset-button').hide();
			$('#chart-stop-button').show();
			chart_controller.start();
		}
		else 
			alert('Error: chart not generated yet');
	});
	$('#chart-stop-button').click(function(){
		if (chart_controller)
		{
			if (chart_controller.current_time < chart_controller.end_time)
			{
				$('#chart-stop-button').hide();
				$('#chart-start-button').show();
				$('#chart-reset-button').show();
				chart_controller.stop();
			}
			else
			{
				d3.select('#taxi-data').select('#svg-main').remove();
				d3.select('#taxi-data').select('#svg-axis').remove();
				$('#chart-generate-button').show();
				$('#chart-stop-button').hide();
				$('.chart-input').removeAttr('disabled','disabled');
			}
		}
		else
			alert ('It seems that you ran into a bug, please reload the page');
	});
	$('#chart-reset-button').click(function(){
			d3.select('#taxi-data').select('#svg-main').remove();
			d3.select('#taxi-data').select('#svg-axis').remove();
			$('.chart-input').removeAttr('disabled','disabled');
			$('#chart-generate-button').show();
			$('#chart-start-button').hide();
			$('#chart-reset-button').hide();
			chart_controller = null;
	});
	$('#chart-generate-button').click(function(){

		$('.chart-input').attr('disabled','disabled');
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


		// Obtain time from the html 
		//
		// The process:
		// Get time from html, convert it to UTC, i.e. subtract the offset from it
		var start_time = ($('#chart-input-start-day').val() + ' ' + $('#chart-input-start-month').val() + ' ' + available_year
											+ ' ' + $('#chart-input-start-time').val() + ' UTC');
		start_time = new Date(start_time);
		start_time.setHours(start_time.getHours() - time_offset);
		var end_time = ($('#chart-input-end-day').val() + ' ' + $('#chart-input-end-month').val() + ' ' + available_year
											+ ' ' + $('#chart-input-end-time').val() + ' UTC');
		end_time = new Date(end_time);
		end_time.setHours(end_time.getHours() - time_offset);

		coverageRadius = $('#chart-input-radius').val();	
		if (end_time <= start_time)
			alert("Start time is greater than or equal to end time");
		else
		{
			console.log("Generating chart data from " + start_time + ' to ' + end_time);
			generate_taxi_chart(start_time.getTime()/1000,
													end_time.getTime()/1000, 
													time_offset,
													$('#chart-input-type').val(), 
													$('#chart-input-radius').val(),
													$('#chart-input-interval').val(),
													$('#chart-input-max').val(),
													map_boundaries,
													custom_area_limits)
				.then(function(returned_value){
					chart_controller = returned_value;
					$('#chart-generate-button').hide();
					$('#chart-start-button').show();
					$('#chart-reset-button').show();
				});
		}
	});
});// end jquery

function generate_taxi_chart(start_time, end_time, time_offset,
														 type, radius, interval, max_value,
														 boundaries, custom_area_limits)
{
	var svg_height = 400;
	var svg_width = (end_time-start_time)/interval*1;
	var svg_top_offset = 20;

	var chart_div = d3.select('#taxi-data');
	var chart_svg_axis = chart_div.append('svg')
		.attr('id','svg-axis')
		.attr('height',svg_height)
		.attr('width',200)
	var chart_svg = chart_div.append('svg')
		.attr('id','svg-main')
		.attr('height',svg_height)
		.attr('width',svg_width)

	var chart_drawer;
	var callback = function(){
		$('#taxi-save-svg').removeAttr('disabled','disabled');
		$('#taxi-save-svg').click(function(){
		//var svg_to_save = $('#svg-main').svg('get');
		var svg_to_save = document.getElementById('svg-main');
		svg_to_save = new XMLSerializer().serializeToString(svg_to_save);
		var blob = new Blob([svg_to_save],{type:'image/svg+xml;charset=utf-8'});

		saveAs(blob,'test.svg');
		});
		//var svg_to_save = new XMLSerializer().serializeToString($('#svg-main'));

	}

	chart_parameters = { start_time 			: start_time,
											 end_time   			: end_time,
											 time_offset   		: time_offset,
											 type							: type,
											 radius				    : parseInt(radius),
											 interval					: parseInt(interval),
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
											 svg_width				: svg_width,
											 svg_top_offset		: svg_top_offset,
											 draw							: true,
											 callback_fn			: callback
										 };

	chart_drawer = new TaxiData(chart_parameters);

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
