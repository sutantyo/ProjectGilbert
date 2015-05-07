$(document).ready(function(){
	var animation_controller;

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
	$('.start-time').val('10:00');
	$('.start-time').selectpicker('render');
	$('.end-time').val('11:00');
	$('.end-time').selectpicker('render');
	/* END OF BRITTLENESS (I hope) */

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


	// Chart related
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


	// Interesting code starts here:

	$('#map-generate-button').click(function(){
		$('.map-input').attr('disabled','disabled');
		var UTC_start_time = ($('#map-input-start-day').val() + ' ' + $('#map-input-start-month').val() + ' ' + available_year
											+ ' ' + $('#map-input-start-time').val() + ' UTC');
		UTC_start_time = new Date(UTC_start_time);
		UTC_start_time = UTC_start_time.getTime()/1000;
		var UTC_end_time = ($('#map-input-end-day').val() + ' ' + $('#map-input-end-month').val() + ' ' + available_year
											+ ' ' + $('#map-input-end-time').val() + ' UTC');
		UTC_end_time = new Date(UTC_end_time);
		UTC_end_time = UTC_end_time.getTime()/1000;

		coverageRadius = $('#map-input-radius').val();	
		if (UTC_end_time <= UTC_start_time)
		{
			alert("Start time is greater than or equal to end time");
		$('.map-input').removeAttr('disabled','disabled');
		}
		else
		{
			console.log("Generating map animation from " + UTC_start_time + ' to ' + UTC_end_time);
			generate_taxi_animation(UTC_start_time,UTC_end_time)
				.then(function(returned_value){
					animation_controller = returned_value;
					animation_controller.stop_animation = true;
					animation_controller.animation_loop();
					/*
					animation_controller.animation_loop().then(function(){
						animation_controller.overlay.add_listeners_on_circles();
					});
					*/

					$('#map-generate-button').hide();
					$('#map-start-button').show();
					$('#map-reset-button').show();
					},function(){
						alert('Error retrieving data');		
				})
				.then(function(){
						animation_controller.add_listeners_to_circles();
				});	
		}

	$('#map-start-button').click(function(){
		if (animation_controller)
		{
			$('#map-start-button').hide();
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
			$('#map-stop-button').hide();
			$('#map-start-button').show();
			animation_controller.stop_animation = true;
		}

	});

	$('#map-reset-button').click(function(){
		animation_controller.overlay.setMap(null);
		$('.map-input').removeAttr('disabled','disabled');
		$('#map-generate-button').show();
		$('#map-start-button').hide();
		$('#map-reset-button').hide();
	});
		


	});

	$('#chart-generate-button').click(function(){

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
			console.log("Generating chart data from " + UTC_start_time + ' to ' + UTC_end_time);
			//chart_div.select('svg').remove();
			//chart_svg = chart_div.append('svg')
			//.attr('height',400)
			//.attr('width',1800)
			//chartDrawer(UTC_start_time.getTime()/1000,UTC_end_time.getTime()/1000, $('#chart-input-type').val(), 60,$('#chart-input-radius').val(),1);
			d3.select('#taxi-data').select('svg').remove();
			generate_taxi_chart(UTC_start_time.getTime()/1000,UTC_end_time.getTime()/1000, $('#chart-input-type').val())
				.then(function(returned_value){
					returned_value.chart_drawing_loop();
				});
		}
	});

	$('#chart-input-type').change(function(){
	});
	
	$('#chart-input-radius').change(function(){
		console.log('radius changed');
	});
});
