
function TaxiChartDrawer(params){

	this.chunk_start_time = this.current_time =  params.chart_start_time;
	this.chunk_size = params.data_chunk_size;
	this.chunk_end_time = this.chunk_start_time + this.chunk_size;

	this.data_url = params.data_url;
	this.interval = params.interval;

	this.active_data = [];
	this.next_set_of_data = [];

	this.svg = params.svg;
	this.type = params.chart_type;
	this.max_value = 150;
	this.svg_height = 400;

	this.marker = 0;
	this.stop_drawing = false;
}

TaxiChartDrawer.prototype.chart_drawing_loop = function()
{
	console.log('started chart_drawing_loop')
	var _this = this;

	var current_batch = [];
	for (var i = 0; i < _this.active_data.length; i++)
	{
		if (_this.active_data[i].time < (_this.current_time + _this.animation_step))
			current_batch.push(_this.active_data[i]);
		else
		{
			_this.active_data.splice(0,i);
			break;
		}
	}

	_this.current_time = _this.current_time + _this.interval;
	if (_this.current_time === _this.chunk_end_time)
	{
		_this.active_data = _this.next_set_of_data;	
		d3.json(_this.data_url + 'time?start=' + (_this.current_time+_this.chunk_size) + '&end=' + (_this.current_time+2*_this.chunk_size), function(error,data){
			if (error){
				alert('Error obtaining data from ' + start_time + ' to ' + end_time);
				return;
			}
			else
				_this.next_set_of_data = data;
		});
	}

	var graph_promise = TaxiChartDrawer.build_graph(current_batch,_this.radius,_this.type);	
	graph_promise.then(function(returned_graph){
		//console.log(msg + ' up to ' + _this.current_time);
		var draw_chart_promise = _this.draw_chart(_this.marker++,_this.svg);
		draw_chart_promise
			.then(function(msg){
				console.log(msg + ' up to ' + _this.current_time);
				if (_this.stop_drawing || _this.current_time >= _this.end_time)
					return;
				else
				{
					return _this.animation_loop();
				}
			});
	});	
}

TaxiChartDrawer.build_graph = function(data,radius,type)
{
	var a = performance.now();
	var graph = new Graph();
	var _duplicate_check = [];

	data.forEach(function(datum){
		if (_duplicate_check[datum.id] !== 1)
		{
				graph.nodes.push({id: datum.id, x: Number(datum.x), y: Number(datum.y), neighbours: []});
				_duplicate_check[datum.id] = 1;
		}
	});
	graph.find_neighbours(radius);

	var chart_data = [];
 
 	console.log(type);
	if (type === 'degree')	
	{
		var degrees = [];
		var degrees_sum = 0;
		graph.nodes.forEach(function(node){
			degrees.push(node.neighbours.length);
			degrees_sum = degrees_sum + node.neighbours.length;
		});
		degrees.sort(function(a,b){return a-b});
		_length = degrees.length;
		chart_data.push({
			 pctl25: degrees[Math.round(_length/4)],
			 pctl50: degrees[Math.round(_length/2)],
			 pctl75: degrees[Math.round(3 * _length/4)],
			 pctl100: degrees[_length-1],
			 mean: degrees_sum/_length
			});
	}
	else if (type === 'diameter')
	{
		graph.build_components();
		console.log("Calculating chart data for diameter");
		var diameters = [];
		graph.components.forEach(function(graph){
			diameters.push(graph.diameter);
		});

		diameters.sort(function(a,b){return a-b});
		_length = diameters.length;
		chart_data.push({
			 pctl25: diameters[Math.round(_length/4)],
			 pctl50: diameters[Math.round(_length/2)],
			 pctl75: diameters[Math.round(3 * _length/4)],
			 pctl100: diameters[diameters.length-1]
			});
	}
	else if (type === 'component')
	{
		graph.build_components();
		console.log("Calculating chart data for component");
		var component_sizes = [];
		graph.components.forEach(function(graph){
			component_sizes.push(Math.log(graph.length));
		});

		component_sizes.sort(function(a,b){return a-b});
		_length = component_sizes.length;
		chart_data.push({
			 pctl25: component_sizes[Math.round(_length/4)],
			 pctl50: component_sizes[Math.round(_length/2)],
			 pctl75: component_sizes[Math.round(3 * _length/4)],
			 pctl100: component_sizes[component_sizes.length-1]
			});
	}
	else
	{
		console.error("ERROR IN TYPE SELECTION");
	}

	console.log('build time: ' + (performance.now()-a));
	return new Promise( function(resolve,reject){
		resolve(chart_data);
	});
}

TaxiChartDrawer.prototype.scalingFn = function()
{
	return d3.scale.linear().domain([0,this.max_value]).rangeRound([0,this.svg_height]);
}


TaxiChartDrawer.prototype.draw_chart = function(draw_marker,chart_data)
{
	var _this = this;
	var enterSelection = _this.svg.selectAll('rect').data(chart_data).enter();
	var width = 1;

	enterSelection	
		.append('rect')
		.attr({
			x:		function(d,i) { return draw_marker + i * width},
			y:		function(d) {return (_this.svg_height - _this.scalingFn(d.pctl25))},
			width: width,
			height: function(d,i){return _this.scalingFn(d.pctl25)},
			fill: '#7f3fed'
		});
	enterSelection	
		.append('rect')
		.attr({
			x:		function(d,i) { return draw_marker + i * width},
			y:		function(d) {return (_this.svg_height - _this.scalingFn(d.pctl50))},
			width: width,
			height: function(d,i){return _this.scalingFn(d.pctl50) - _this.scalingFn(d.pctl25)},
			fill: '#7db8ec'
		});
	enterSelection
		.append('rect')
		.attr({
			x:		function(d,i) { return draw_marker + i * width},
			y:		function(d) {return (_this.svg_height - _this.scalingFn(d.pctl75))},
			width: width,
			height: function(d,i){return _this.scalingFn(d.pctl75)-_this.scalingFn(d.pctl50)},
			fill: '#a77eed'
		});
	enterSelection
		.append('rect')
		.attr({
			x:		function(d,i) { return draw_marker + i * width},
			y:		function(d) {return (_this.svg_height - _this.scalingFn(d.pctl100))},
			width: width,
			height: function(d,i){return _this.scalingFn(d.pctl100)-_this.scalingFn(d.pctl75)},
			fill: '#b0d0ec'
		});
	enterSelection
		.append('rect')
		.attr({
			x:		function(d,i) { return draw_marker + i * width},
			y:		function(d) {return (_this.svg_height - _this.scalingFn(d.mean))},
			width: width,
			height: function(d,i){return 1},
			fill: 'red'
		});
}


