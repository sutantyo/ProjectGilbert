$(document).ready(function(){
	var animation_controller;
	var map_using_custom_area = false;

	$('#map-input-start-month').change(function(){
		var _this = $(this);
		available_dates.forEach(function(dates){
			if (dates.month === _this.val())
			{
				$('#map-input-start-day').empty();
				for(var i = dates.min_date; i <= dates.max_date; i++)
				{
					$('#map-input-start-day').append('<option value = "' + i + '">' + i + '</option>'); 
				}
				$('#map-input-start-day').selectpicker('refresh');
			}
		});
	});
	$('#map-input-end-month').change(function(){
		var _this = $(this);
		available_dates.forEach(function(dates){
			if (dates.month === _this.val())
			{
				$('#map-input-end-day').empty();
				for(var i = dates.min_date; i <= dates.max_date; i++)
				{
					$('#map-input-end-day').append('<option value = "' + i + '">' + i + '</option>'); 
				}
				$('#map-input-end-day').selectpicker('refresh');
			}
		});
	});
	$('#map-edge-button').click(function(){
		var _this = this;
		if ($(_this).hasClass('clicked'))
		{
			animation_controller.overlay.show_edges = false;
			animation_controller.overlay.update();
			$(_this).removeClass('clicked');
		}
		else
		{
			animation_controller.overlay.show_edges = true;
			animation_controller.overlay.update();
			$(_this).addClass('clicked');
		}
	});
	$('#map-label-button').click(function(){
		var _this = this;
		if ($(_this).hasClass('clicked'))
		{
			animation_controller.overlay.show_labels = false;
			animation_controller.overlay.update();
			$(_this).removeClass('clicked');
		}
		else
		{
			animation_controller.overlay.show_labels = true;
			animation_controller.overlay.update();
			$(_this).addClass('clicked');
		}

	});

	$('#map-button-custom-area').click(function(){
		var _this = this;
		if ($(_this).hasClass('clicked'))
		{
			map_using_custom_area = false;
			$(_this).removeClass('clicked');
		}
		else
		{
			map_using_custom_area = true;
			$(_this).addClass('clicked');
		}

	});


	// Interesting code starts here:


	$('#map-start-button').click(function(){
		if (animation_controller)
		{
			animation_controller.remove_listeners_on_circles();
			$('#map-start-button').hide();
			$('#map-reset-button').hide();
			$('#map-stop-button').show();

			animation_controller.stop_animation = false;
			animation_controller.animation_loop();
		}
		else 
		{
			alert('Error: animation not ready');
		}
	});

	$('#map-stop-button').click(function(){
		if (animation_controller)
		{
			if (animation_controller.current_time < animation_controller.end_time)
			{
				animation_controller.add_listeners_on_circles();
				$('#map-stop-button').hide();
				$('#map-start-button').show();
				$('#map-reset-button').show();
				animation_controller.stop_animation = true;
			}
			else
			{
				//animation_controller.overlay.setMap(null);
				animation_controller.overlay.main_svg.selectAll('*').remove();
				$('#map-generate-button').show();
				$('#map-stop-button').hide();
				$('.map-input').removeAttr('disabled','disabled');
			}
		}
		else
		{
			alert('It seems that you ran into a bug, please reload the page');
		}

	});

	$('#map-reset-button').click(function(){
		animation_controller.overlay.main_svg.selectAll('*').remove();
		$('.map-input').removeAttr('disabled','disabled');
		$('#map-generate-button').show();
		$('#map-start-button').hide();
		$('#map-reset-button').hide();
		$('#map-stop-button').hide();
		$('#map-edge-button').attr('disabled','disabled');
		$('#map-label-button').attr('disabled','disabled');
	});


	$('#map-generate-button').click(function(){

		// Once the generate button is clicked, all input boxes should be disabled
		// (except for the buttons for 'labels' and 'edges' which will be enabled later)
		$('.map-input').attr('disabled','disabled');

		// Define the map area in which the drawing will take place 
		// ... if custom area is not used, it will use the default map boundaries stored in the html
		var custom_area_limits = [];
		if (map_using_custom_area)
		{ 
			custom_area_limits = { 	x_min: $('#map-input-sw-coord-x').val(),
															x_max: $('#map-input-ne-coord-x').val(),
															y_min: $('#map-input-sw-coord-y').val(),
															y_max: $('#map-input-ne-coord-y').val() };
		}
		else
		{
			custom_area_limits = { 	x_min: map_boundaries[3].x,
															x_max: map_boundaries[1].x,
															y_min: map_boundaries[3].y,
															y_max: map_boundaries[1].y };
		}


		// Construct UNIX epoch time for start and end times 
		var UTC_start_time = ($('#map-input-start-day').val() + ' ' + $('#map-input-start-month').val() + ' ' + available_year
											+ ' ' + $('#map-input-start-time').val() + ' UTC');
		UTC_start_time = new Date(UTC_start_time);
		UTC_start_time = UTC_start_time.getTime()/1000;
		var UTC_end_time = ($('#map-input-end-day').val() + ' ' + $('#map-input-end-month').val() + ' ' + available_year
											+ ' ' + $('#map-input-end-time').val() + ' UTC');
		UTC_end_time = new Date(UTC_end_time);
		UTC_end_time = UTC_end_time.getTime()/1000;


		// Sanity check
		if (UTC_end_time <= UTC_start_time)
		{
			alert("Start time is greater than or equal to end time");
			$('.map-input').removeAttr('disabled','disabled');
		}
		// Create a new TaxiAnimation object and start the show
		else
		{
			animation_controller = null;
			console.log("Generating map animation from " + UTC_start_time + ' to ' + UTC_end_time);
			generate_taxi_animation(UTC_start_time,
															UTC_end_time,
															$('#map-input-radius').val(),
															$('#map-input-interval').val(),
															map_boundaries,
															custom_area_limits
															)
				.then(function(returned_value){
						animation_controller = returned_value;
						animation_controller.stop_animation = true;
						$('#map-generate-button').hide();
						$('#map-start-button').show();
						$('#map-reset-button').show();
						return animation_controller.animation_loop();
					},function(){
				})
				.then(function(){
						animation_controller.add_listeners_on_circles();
						$('#map-edge-button').removeAttr('disabled','disabled');
						$('#map-label-button').removeAttr('disabled','disabled');
				});	
		}

	});

		
});// end jquery




function generate_taxi_animation(	start_time,end_time,
																	radius,interval,
																	boundaries, custom_area_limits)
{
	// Set some parameters for the overlay animation (e.g. transition time), 
	// these methods are in our inherited class
	var overlay = new OverlayView();
	overlay.setTransitionTime(1000);
	overlay.setBoundaries(boundaries);
	overlay.setMap(map);

	animation_parameters = { animation_start_time : start_time, 
													 animation_end_time		: end_time,
													 animation_step				: parseInt(interval),
													 data_url							: data_url,
													 data_chunk						: data_chunk_size,
													 radius								: radius,
													 x_min								: parseFloat(custom_area_limits.x_min),
													 x_max								: parseFloat(custom_area_limits.x_max),
													 y_min								: parseFloat(custom_area_limits.y_min),
													 y_max								: parseFloat(custom_area_limits.y_max)
												};	
	var anim = new TaxiAnimation(overlay, animation_parameters);
	//anim.animation_loop();


	return new Promise (function(resolve,reject){
		d3.json(data_url + 'time?start=' + start_time + '&end=' + (start_time+data_chunk_size), function(error,data){
			if (error) reject('Error getting initial data' + error);
			else
			{
				anim.active_data = data;
				if (start_time+data_chunk_size <= end_time)
				{
					d3.json(data_url + 'time?start=' + (start_time+data_chunk_size) + '&end=' + (start_time+2*data_chunk_size), function(error,data){
						if (error) reject('Error getting initial data' + error);
						else
						{
							anim.next_set_of_data = data;
							resolve(anim);
						}
					});
				}
				else
				{
					resolve(anim);
				}
			}
		});
	});
}

