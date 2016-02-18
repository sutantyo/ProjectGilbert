// jQuery listeners for the export part of the main html
//
// 1. Start time, end time, radius, and 

$(document).ready(function(){
	var export_using_custom_area = false;

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

	$('.export-type').click(function(){
		var _this = this;
		if ($(_this).hasClass('clicked'))
			$(_this).removeClass('clicked');
		else
			$(_this).addClass('clicked');
	});
	$('#export-all').click(function(){
		var _this = this;
		if ($(_this).hasClass('clicked'))
		{
			$('.export-type').each(function(index,element){
				$(element).removeClass('clicked');
				$(element).removeAttr('disabled','disabled');
			})
			$(_this).removeClass('clicked');
		}
		else
		{
			$(_this).addClass('clicked');
			$('.export-type').each(function(index,element){
				$(element).attr('disabled','disabled');
				$(element).addClass('clicked');
			})
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

	$('#export-generate-button').click(function(){
		// if no type (i.e. degrees, diameters) is selected, do nothing
		if ( !($('.export-type').hasClass('clicked')) )
			return;
				// Set the time parameters
				//
		var start_time = ($('#export-input-start-day').val() + ' ' + $('#export-input-start-month').val() + ' ' + available_year
											+ ' ' + $('#export-input-start-time').val() + ' UTC');
		start_time = new Date(start_time);
		start_time.setHours(start_time.getHours() - time_offset);
		start_time = start_time.getTime()/1000;
		var end_time = ($('#export-input-end-day').val() + ' ' + $('#export-input-end-month').val() + ' ' + available_year
											+ ' ' + $('#export-input-end-time').val() + ' UTC');
		end_time = new Date(end_time);
		end_time.setHours(end_time.getHours() - time_offset);
		end_time = end_time.getTime()/1000;
		/*
		var UTC_start_time = new Date(($('#export-input-start-day').val() + ' ' + $('#export-input-start-month').val() + ' ' 
												+ available_year + ' ' + $('#export-input-start-time').val() + ' UTC'));
		var start_time = UTC_start_time.getTime()/1000;
		var UTC_end_time = new Date(($('#export-input-end-day').val() + ' ' + $('#export-input-end-month').val() + ' ' 
												+ available_year + ' ' + $('#export-input-end-time').val() + ' UTC'));
		var end_time = UTC_end_time.getTime()/1000;
		*/
		if (end_time <= start_time)
		{
			alert("Start time is greater than or equal to end time");
			return;
		}

		var active_data;
		var next_set_of_data;

		// if there is at least one element selected, get the data based on the paramaters
		d3.json(data_url + 'time?start=' + start_time + '&end=' + (start_time+data_chunk_size), function(error,data){
			if (error) 
			{
				console.error('Error getting initial data');
				alert('There is a problem obtaining the data. Is the database running?');
				return;
			}
			else
			{
				active_data = data;
				if (start_time+data_chunk_size <= end_time)
				{
					d3.json(data_url + 'time?start=' + (start_time+data_chunk_size) + '&end=' + (start_time+2*data_chunk_size), function(error,data){
						if (error) 
						{
							console.error('Error getting initial data');
							alert('There is a problem obtaining the data. Is the database running?');
							return;
						}
						else
						{
							next_set_of_data = data;
							$('.export-type').each(function(index,element){
								if ($(element).hasClass('clicked'))
								{
									var title = $(element).text();
									title = title + ', ' + $('#export-input-start-month').val() + ' ' + $('#export-input-start-day').val() + ' ' +
													$('#export-input-start-time').val();
									if ($('#export-input-start-month').val() === $('#export-input-end-month').val() && 
										  $('#export-input-start-date').val() === $('#export-input-end-date').val() 				)
									{
										title = title + ' to ' + $('#export-input-end-time').val();
									}
									else
									{
										title = title + ' to ' + $('#export-input-end-month').val() +  ' ' + $('#export-input-end-day').val() + ' ' +
														 $('#export-input-end-time').val();;
									}
									title = title + ', ' + parseInt($('#export-input-radius').val()) + 'm';
									title = title + ', ' + parseInt($('#export-input-interval').val()) + 's';
									var type = $(element).data('type');	
									export_generator(title,type,start_time,end_time,active_data,next_set_of_data);
								}
							});
						}
					});
				}
			}
		});
	});


	function export_generator(title,type,start_time,end_time,active_data,next_set_of_data)
	{

		var custom_area_limits = [];
		if (export_using_custom_area)
		{ 
			custom_area_limits = { 	x_min: $('#export-input-sw-coord-x').val(),
															x_max: $('#export-input-ne-coord-x').val(),
															y_min: $('#export-input-sw-coord-y').val(),
															y_max: $('#export-input-ne-coord-y').val() };
			title = title + ', in (' + custom_area_limits.x_min + ',' + custom_area_limits.y_min + ') to (' + 
															 custom_area_limits.x_max + ',' + custom_area_limits.y_max + ')';
		}
		else
		{
			custom_area_limits = { 	x_min: map_boundaries[3].x,
															x_max: map_boundaries[1].x,
															y_min: map_boundaries[3].y,
															y_max: map_boundaries[1].y };
		}

		// Create the div that will hold the progress bar, download, and reset buttons
		var export_div = $('<div></div>',{
													'class':'row no-gutter export-result',
											});
		export_div.appendTo('#taxi-data-results');
		var title_and_progress_div = $('<div></div>',{
													'class':'col-md-8 col-sm-8 col-xs-12'
												});
		title_and_progress_div.appendTo(export_div);
		var title_div = $('<div></div>',{
													'text' : title
												});
		title_div.appendTo(title_and_progress_div);
		var progress_div = $('<div></div>',{
													'class':'progress'
												});
		progress_div.appendTo(title_and_progress_div);
		var progress_bar = $('<div></div>',{
													'class':'progress-bar',
													'role' :'progressbar',
													'aria-valuenow':'0',
													'aria-valuemin':'0',
													'aria-valuemax':'100',
													'style':'min-width:2em; width:0%',
													'text' : '0%'
												});
		progress_bar.appendTo(progress_div);
		var json_dl_button = $('<div></div>',{
													'class':'col-md-1 col-sm-1 col-xs-4 button btn btn-default',
													'disabled':'disabled',
													'text':'JSON'
												});
		json_dl_button.appendTo(export_div);
		var csv_dl_button = $('<div></div>',{
													'class':'col-md-1 col-sm-1 col-xs-4 button btn btn-default',
													'disabled':'disabled',
													'text':'CSV'
												});
		csv_dl_button.appendTo(export_div);
		var draw_button = $('<div></div>',{
													'class':'col-md-1 col-sm-1 col-xs-4 button btn btn-default',
													'disabled':'disabled',
												});
		draw_button.appendTo(export_div);
		$('<span></span>',{'class':'glyphicon glyphicon-picture'}).appendTo(draw_button);
		var remove_button = $('<div></div>',{
													'class':'col-md-1 col-sm-1 col-xs-4 button btn btn-default',
													'disabled':'disabled',
												});
		remove_button.appendTo(export_div);
		$('<span></span>',{'class':'glyphicon glyphicon-remove'}).appendTo(remove_button);

		var chart_id = type + (new Date).getTime();
		console.log(chart_id);
		var chart_div = $('<div></div>',{
													'id':chart_id
												});

		// Set the parameters for custom area (if using)
		var callback = function(){
			json_dl_button.click(function(){
				var export_data = JSON.stringify(export_controller.data_storage);
				var blob = new Blob([export_data],{type:'file/json'},title);
				saveAs(blob,title+'.json');
			});
			csv_dl_button.click(function(){
				var export_data = export_to_csv(export_controller.data_storage);
				var blob = new Blob([export_data],{type:'file/csv'},title);
				saveAs(blob,title+'.csv');
			});
			draw_button.click(function(){
				chart_div.appendTo(export_div);
				export_controller.draw_from_data(chart_id,300);
			});
			json_dl_button.removeAttr('disabled','disabled');
			csv_dl_button.removeAttr('disabled','disabled');
			draw_button.removeAttr('disabled','disabled');
		}

		var update = function(pct_completed){
			progress_bar.attr('aria-value-now',pct_completed);
			progress_bar.attr('style','width:'+pct_completed+'%');
			progress_bar.text(pct_completed+'%');
		}

		export_parameters = { start_time 			: start_time,
													end_time   			: end_time,
													type						: type,
													radius					: parseInt($('#export-input-radius').val()),
													interval   			: parseInt($('#export-input-interval').val()),
													x_min						: parseFloat(custom_area_limits.x_min),
													x_max						: parseFloat(custom_area_limits.x_max),
													y_min						: parseFloat(custom_area_limits.y_min),
													y_max						: parseFloat(custom_area_limits.y_max),
													data_url				: data_url,
													active_data			: active_data,
													next_set_of_data: next_set_of_data,
													data_chunk_size : data_chunk_size,
													update_fn			  : update,
													callback_fn			: callback,
													draw						: false
										 };
		var export_controller = new TaxiData(export_parameters);
		export_controller.start();

		remove_button.removeAttr('disabled','disabled');
		remove_button.click(function(){
			export_controller.stop();
			delete export_controller;
			export_div.remove();
		});
	}


	// Export to CSV function
	
	var export_to_csv = function(data_to_export)
	{
		var export_string = '';
		data_to_export[0].forEach(function(object){
			var objectString = '';
			for(var key in object) 
			{
				if(object.hasOwnProperty(key))
					objectString = objectString + key + ',';
			}
			objectString = objectString.slice(0,-1);
			export_string = export_string + objectString + '\n';
		});

		data_to_export.forEach(function(row){
			row.forEach(function(object){
				var objectString = '';
				for(var key in object) 
				{
					if(object.hasOwnProperty(key))
						objectString = objectString + object[key] + ',';
				}
				objectString = objectString.slice(0,-1);
				export_string = export_string + objectString + '\n';
			});
		});
		return export_string;	
	}
});
