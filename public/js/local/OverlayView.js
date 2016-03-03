// This class extends Google Maps' OverlayView class
OverlayView.prototype = new google.maps.OverlayView();

// Some functions of the OverlayView class are redefined below
function OverlayView(){

	var _projection;
	var _main_layer;
	this.main_svg

	var x_padding = 62;
	var y_padding = -56;
	var boundary_points = [];

	var offset;
	var transition_time;

	this.show_labels = false;
	this.show_edges = true;

	this.nodes = [];
	this.edges = [];

	this.show

	this.setTransitionTime = function(input){
		transition_time = input;
	};

	this.setBoundaries = function(input){
		boundary_points = input;
	};

	this.onAdd = function() {
		//console.log('onAdd');
		_main_layer  = d3.select(this.getPanes().overlayMouseTarget).append('div').attr('id','main-layer');
		this.main_svg	=	_main_layer.append('svg').style('position','absolute')
	};

	this.onRemove = function() {
		_main_layer.remove();
	};

	this.draw = function() {
		//console.log("called draw");
		_projection = this.getProjection();
		var _NW_point = find_pixel_position_of(boundary_points[0]);
		offset = {x : _NW_point.x, y : _NW_point.y};

		this.main_svg
			.style('left', offset.x + 'px')
			.style('top', offset.y + 'px')
			.attr({
				'height': distance_in_pixels_between(boundary_points[0],boundary_points[3]),
				'width': distance_in_pixels_between(boundary_points[0],boundary_points[1])
				})
		var connections = this.main_svg.selectAll('path').data(this.edges,function(d){return d.id});
		connections
			.attr('d',function(d){return lineFunction(d.path)})
			.style('stroke',function(d){return d.origin.color})
			.style('stroke-width','1pt');
		var taxis = this.main_svg.selectAll('circle').data(this.nodes,function(d){return d.id});
		taxis.each(update_circle_position2);

		var labels = this.main_svg.selectAll('text').data(this.nodes,function(d){return d.id});
		labels
			.attr({
				'x': function(d){return find_pixel_position_of(d).x - offset.x + 7},
				'y': function(d){return find_pixel_position_of(d).y - offset.y + 5},
				'fill': function(d){ return d.color}
			})
			.text(function(d){ return d.id })
			.style('fill-opacity',1)

	};

	this.update = function(){
		//console.log("called update");

		this.main_svg
			.style('left', offset.x + 'px')
			.style('top', offset.y + 'px')
			.attr({
				'height': distance_in_pixels_between(boundary_points[0],boundary_points[3]),
				'width': distance_in_pixels_between(boundary_points[0],boundary_points[1])
				})

		if (this.show_edges)
		{
			var connections = this.main_svg.selectAll('path').data(this.edges,function(d){return d.id});
			connections
				.transition()
				.duration(transition_time*0.8)
				.attr('d',function(d){return lineFunction(d.path)})
				.style('stroke',function(d){return d.origin.color})
				.style('stroke-width','1pt')
			connections.enter().append('path')
				.attr('d',function(d){return lineFunction(d.path)})
				.style('stroke','blue')
				.style('position','absolute')
				.style('stroke-width','0pt')
				.style('stroke',function(d){return d.origin.color})
				.transition()
					.delay(transition_time*0.8)
					.duration(transition_time*0.2)
					.style('stroke-width','1pt')
			connections.exit()
				.transition().duration(transition_time*0.25).style('stroke-width','0pt')
				.remove();
		}
		else
		{
			this.main_svg.selectAll('path').remove();
		}

		var taxis = this.main_svg.selectAll('circle').data(this.nodes,function(d){return d.id});
		taxis.each(update_circle_position);
		taxis.enter().append('circle').each(set_circle_position)
			.style('fill-opacity',1e-6).transition().duration(transition_time*0.8).style('fill-opacity',1)
		//taxis.on('click',function(d){console.log(d);});

		taxis.exit()
			.transition().duration(transition_time*0.25).style('fill-opacity',1e-6)
			.remove();

		if (this.show_labels)
		{
			var labels = this.main_svg.selectAll('text').data(this.nodes,function(d){return d.id});
			labels.transition()
				.duration(transition_time)
				.attr({
					'x': function(d){
						return find_pixel_position_of(d).x - offset.x + 7},
					'y': function(d){return find_pixel_position_of(d).y - offset.y + 5},
					'fill': function(d){return d.color}
				})
				.text(function(d){ return d.id })
				.style('fill-opacity',1)
			labels.enter().append('text')
				.attr({
					'x': function(d){return find_pixel_position_of(d).x - offset.x + 7},
					'y': function(d){return find_pixel_position_of(d).y - offset.y + 5},
					'fill': function(d){return d.color}
				})
				.text(function(d){ return d.id })
				.style('fill-opacity',1e-6)
				.transition()
					.duration(transition_time*0.5)
					.style('fill-opacity',1)
			labels.exit()
				.transition()
				.duration(transition_time)
				.style('fill-opacity',1e-6)
				.remove();
		}
		else
		{
			this.main_svg.selectAll('text').remove();
		}




	}; // end this.update
	var lineFunction = d3.svg.line()
		.x(function(d) {return find_pixel_position_of(d).x - offset.x;})
		.y(function(d) {return find_pixel_position_of(d).y - offset.y;})
		.interpolate('linear');

	function find_pixel_position_of(d){
		var LatLng = new google.maps.LatLng(d.x, d.y);
		var position = _projection.fromLatLngToDivPixel(LatLng);
		return position;
	}
	function distance_in_pixels_between(d1,d2){
		d1 = find_pixel_position_of(d1);
		d2 = find_pixel_position_of(d2);
		var distance = Math.sqrt((d2.x-d1.x)*(d2.x-d1.x)+(d2.y-d1.y)*(d2.y-d1.y));
		return distance;
	};

	function update_circle_position(d){
		var position = find_pixel_position_of(d);
		return d3.select(this)
			.transition().duration(transition_time*1.00)
			.style('fill-opacity',1)
			.attr({
				'cx': function(d){return position.x - offset.x},
				'cy': function(d){return position.y - offset.y},
				'r': 6,
				'fill': function(d){return d.color},
				'stroke': 'white'
			})
	}
	function update_circle_position2(d){
		var position = find_pixel_position_of(d);
		return d3.select(this)
			.style('fill-opacity',1)
			.attr({
				'cx': function(d){return position.x - offset.x},
				'cy': function(d){return position.y - offset.y},
				'r': 6,
				'fill': function(d){return d.color},
				'stroke': 'white'
			})
	}
	function set_circle_position(d){
		var position = find_pixel_position_of(d);
		return d3.select(this)
			.style('fill-opacity',1)
			.style('position','absolute')
			.attr({
				'cx': function(d){return position.x - offset.x},
				'cy': function(d){return position.y - offset.y},
				'r':6,
				'fill': function(d){return d.color},
				'stroke': 'white'
			});
	}


}// end class
