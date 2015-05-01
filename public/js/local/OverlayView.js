// This class extends Google Maps' OverlayView class 
OverlayView.prototype = new google.maps.OverlayView();

// Some functions of the OverlayView class are redefined below
function OverlayView(){

	var _projection;
	var _main_layer;

	var x_padding = 62;
	var y_padding = -56;


	var offset;
	var transitTime;

	this.nodes = [];
	this.edges = [];
	this.boundary_points = [];

	this.test = function()
	{
		console.log(x_padding);
	}

	this.setTransitTime = function(input){
		transitTime = input;
	};

	this.onAdd = function() {
		console.log('onAdd');
		_main_layer  = d3.select(this.getPanes().overlayLayer).append('div').attr('id','main-layer');
		_main_svg	=	_main_layer.append('svg').style('position','absolute')
	};

	this.onRemove = function() {
		_main_layer.remove();
	};

	this.draw = function() {
		console.log("called draw");
		_projection = this.getProjection();
		var _NW_point = find_pixel_position_of(boundary_points[0]);
		offset = {x : _NW_point.x, y : _NW_point.y};

		_main_svg
			.style('left', offset.x + 'px')
			.style('top', offset.y + 'px')
			.attr({
				'height': distance_in_pixels_between(boundary_points[0],boundary_points[3]),
				'width': distance_in_pixels_between(boundary_points[0],boundary_points[1])
				})					
		var connections = _main_svg.selectAll('path').data(this.edges,function(d){return d.id});
		connections
			.attr('d',function(d){return lineFunction(d.path)})
			.style('stroke',function(d){return d.origin.color})
		var taxis = _main_svg.selectAll('circle').data(this.nodes,function(d){return d.id});
		taxis.each(update_circle_position2);

		var labels = _main_svg.selectAll('text').data(this.nodes,function(d){return d.id});
		labels
			.attr({
				'x': function(d){return find_pixel_position_of(d).x - offset.x + 7},
				'y': function(d){return find_pixel_position_of(d).y - offset.y + 5},
				'fill':'black'
			})
			.text(function(d){ return d.id })
			.style('fill-opacity',1)

	};

	this.update = function(){
		console.log("called update");

		_main_svg
			.style('left', offset.x + 'px')
			.style('top', offset.y + 'px')
			.attr({
				'height': distance_in_pixels_between(boundary_points[0],boundary_points[3]),
				'width': distance_in_pixels_between(boundary_points[0],boundary_points[1])
				})					
		
		var connections = _main_svg.selectAll('path').data(this.edges,function(d){return d.id});
		connections.transition()
			.duration(transitTime*0.8)
			.attr('d',function(d){return lineFunction(d.path)})
			.style('stroke',function(d){return d.origin.color})
		connections.enter().append('path')
			.attr('d',function(d){return lineFunction(d.path)})
			.style('stroke','blue')
			.style('position','absolute')
			.style('stroke-width','0pt')
			.style('stroke',function(d){return d.origin.color})
			.transition()
				.delay(transitTime*0.8)
				.duration(transitTime*0.2)
				.style('stroke-width','0.5pt')
		connections.exit()
			.transition().duration(transitTime*0.25).style('stroke-width','0pt')
			.remove();

		var taxis = _main_svg.selectAll('circle').data(this.nodes,function(d){return d.id});
		taxis.each(update_circle_position);
		taxis.enter().append('circle').each(set_circle_position)
			.style('fill-opacity',1e-6).transition().duration(transitTime*0.8).style('fill-opacity',1);

		taxis.exit()
			.transition().duration(transitTime*0.25).style('fill-opacity',1e-6)
			.remove();

		var labels = _main_svg.selectAll('text').data(this.nodes,function(d){return d.id});
		labels.transition()
			.duration(transitTime)
			.attr({
				'x': function(d){
					return find_pixel_position_of(d).x - offset.x + 7},
				'y': function(d){return find_pixel_position_of(d).y - offset.y + 5},
				'fill':'black'
			})
			.text(function(d){ return d.id })
			.style('fill-opacity',1)
		labels.enter().append('text')
			.attr({
				'x': function(d){return find_pixel_position_of(d).x - offset.x + 7},
				'y': function(d){return find_pixel_position_of(d).y - offset.y + 5},
				'fill':'black'
			})
			.text(function(d){ return d.id })
			.style('fill-opacity',1e-6)
			.transition()
				.duration(transitTime*0.5)
				.style('fill-opacity',1)
		labels.exit()
			.transition()
			.duration(transitTime)
			.style('fill-opacity',1e-6)
			.remove();

			


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
			.transition().duration(transitTime*0.8)
			.style('fill-opacity',1)
			.attr({
				'cx': function(d){return position.x - offset.x},
				'cy': function(d){return position.y - offset.y},
				'fill': function(d){return d.color}
			})
	}
	function update_circle_position2(d){
		var position = find_pixel_position_of(d);
		return d3.select(this)
			.style('fill-opacity',1)
			.attr({
				'cx': function(d){return position.x - offset.x},
				'cy': function(d){return position.y - offset.y},
				'fill': function(d){return d.color}
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
				'fill': function(d){return d.color},
				'r':4,
			});
	}


}// end class 


