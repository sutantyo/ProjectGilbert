// jQuery listeners for the export part of the main html
//
// 1. Start time, end time, radius, and 

$(document).ready(function(){
	var export_using_custom_area = false;
	var export_controller = [];

	$('#export-button-custom-area').click(function(){
		var _this = this;
		if ($(_this).hasClass('clicked'))
		{
			export_using_custom_area = false;
			$(_this).removeClass('clicked');
		}
		else
		{
			export_using_custom_area = true;
			$(_this).addClass('clicked');
		}
	});


	$('#export-set-button').click(function(){
		var _this = this;
		if ($(_this).hasClass('clicked'))
		{
			$('.export-input').removeAttr('disabled','disabled');
			$(_this).removeClass('clicked');
		}
		else
		{
			$('.export-input').attr('disabled','disabled');
			$(_this).addClass('clicked');
		}
	});


	$('.export-button').click(function(){
		var type   = $(this).data('type');
		var format = $(this).data('format');

		$('.export-button[data-type='+type+']').hide();

		var progress_bar = $('.progress[data-type='+type+']');
		progress_bar.show();
		$('.download-button[data-type='+type+']').show();
	
		export_generator(type, format,
										 progress_bar.children('.progress-bar').attr('id'),
										 $('.download-button[data-type='+type+'][data-function="download"]').attr('id'));
	});

	$('#download-degrees').click(function(){
			/*
	var myBlob = new Blob([JSON.stringify(export_data)],{type:'application/json'});
	var url = URL.createObjectURL(myBlob);
	window.open(url);
	*/	
			var blob = new Blob([export_controller.export_data],{type:'download/'+export_controller.export_type});
			var url = URL.createObjectURL(blob);
			window.open(url);
	});
	
	function export_generator(type,format,progress_bar_id,download_btn_id)
	{
		var custom_area_limits = [];
		if (export_using_custom_area)
		{ 
			custom_area_limits = { 	x_min: $('#export-input-sw-coord-x').val(),
															x_max: $('#export-input-ne-coord-x').val(),
															y_min: $('#export-input-sw-coord-y').val(),
															y_max: $('#export-input-ne-coord-y').val() };
		}
		else
		{
			custom_area_limits = { 	x_min: map_boundaries[3].x,
															x_max: map_boundaries[1].x,
															y_min: map_boundaries[3].y,
															y_max: map_boundaries[1].y };
		}

		var UTC_start_time = new Date(($('#export-input-start-day').val() + ' ' + $('#export-input-start-month').val() + ' ' 
												+ available_year + ' ' + $('#export-input-start-time').val() + ' UTC'));
		var UTC_end_time = new Date(($('#export-input-end-day').val() + ' ' + $('#export-input-end-month').val() + ' ' 
												+ available_year + ' ' + $('#export-input-end-time').val() + ' UTC'));


		if (UTC_end_time <= UTC_start_time)
			alert("Start time is greater than or equal to end time");
		else
		{
			console.log("Exporting data from " + UTC_start_time + ' to ' + UTC_end_time);	

			export_taxi_data(UTC_start_time.getTime()/1000,
											 UTC_end_time.getTime()/1000,
											 type,
											 $('#export-input-radius').val(),
											 $('#export-input-interval').val(),
											 map_boundaries, 
											 custom_area_limits,
											 format,
											 progress_bar_id,
											 download_btn_id)
				.then(function(returned_value){
					export_controller = returned_value;
					export_controller.start();
				});
		}
	}

});

function export_taxi_data(start_time, end_time,
													type, radius, interval,
													boundaries, custom_area_limits,
													export_type, progress_bar_id, download_btn_id)
{
	console.log(download_btn_id);
	export_parameters = { start_time 			: start_time,
											 	end_time   			: end_time,
											  type						: type,
											  radius					: parseInt(radius),
											  interval   			: parseInt(interval),
												data_url				: data_url,
												data_chunk_size : data_chunk_size,
												x_min						: parseFloat(custom_area_limits.x_min),
												x_max						: parseFloat(custom_area_limits.x_max),
												y_min						: parseFloat(custom_area_limits.y_min),
												y_max						: parseFloat(custom_area_limits.y_max),
												export_type			: export_type,
												progress_bar_id	: progress_bar_id,
												download_btn_id	: download_btn_id,
												draw						: false
										 };

	var chart_drawer = new TaxiData(export_parameters);

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
