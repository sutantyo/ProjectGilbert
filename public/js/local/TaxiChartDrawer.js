
function TaxiChartDrawer(params){

	this.chunk_start_time = this.current_time =  params.chart_start_time;
	this.chunk_size = params.data_chunk_size;
	this.chunk_end_time = this.chunk_start_time + this.chunk_size;

	this.end_time = params.chart_end_time;
	

	this.data_url = params.data_url;
	this.interval = params.chart_interval;

	this.active_data = [];
	this.next_set_of_data = [];

	this.svg = params.svg;
	this.type = params.chart_type;
	this.max_value = 150;
	this.svg_height = 400;
	this.radius = 500;

	this.marker = 0;
	this.stop_drawing = false;
}

TaxiChartDrawer.prototype.chart_drawing_loop = function()
{
	if (this.marker === 300)
		return;

	var _this = this;

	var current_batch = [];
	for (var i = 0; i < _this.active_data.length; i++)
	{
		if (_this.active_data[i].time < (_this.current_time + _this.interval))
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
		_this.chunk_end_time = _this.chunk_end_time + _this.chunk_size;
		d3.json(_this.data_url + 'time?start=' + (_this.current_time+_this.chunk_size) + '&end=' + (_this.current_time+2*_this.chunk_size), function(error,data){
			if (error){
				alert('Error obtaining data from ' + start_time + ' to ' + end_time);
				return;
			}
			else
				_this.next_set_of_data = data;
		});
	}

	setTimeout(function(){
		var graph_promise;
		graph_promise = TaxiChartDrawer.build_graph(current_batch,_this.radius,_this.type);	
		graph_promise.then(function(chart_data){
			var draw_chart_promise = _this.draw_chart(_this.marker++,chart_data);
			draw_chart_promise
				.then(function(msg){
					console.log(_this.current_time + ' vs ' + _this.end_time);
					if (_this.stop_drawing || _this.current_time >= _this.end_time)
						return;
					else
					{
						return _this.chart_drawing_loop();
					}
				});
		});	
	},0);
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
	var _length = 0;

	if (type === 'degrees')	
	{
		var degrees = [];
		var degrees_sum = 0;
		graph.nodes.forEach(function(node){
			degrees.push(node.neighbours.length);
			degrees_sum = degrees_sum + node.neighbours.length;
		});
		degrees.sort(function(a,b){return a-b});
		chart_data.push({
			 pctl25: degrees[Math.round(degrees.length/4)],
			 pctl50: degrees[Math.round(degrees.length/2)],
			 pctl75: degrees[Math.round(3 * degrees.length/4)],
			 pctl100: degrees[degrees.length-1],
			 mean: degrees_sum/degrees.length
			});
	}
	else if (type === 'diameters')
	{
		graph.build_components();
		var diameters = [];
		graph.components.forEach(function(graph){
			diameters.push(graph.diameter);
		});

		diameters.sort(function(a,b){return a-b});
		chart_data.push({
			 pctl25: diameters[Math.round(diameters.length/4)],
			 pctl50: diameters[Math.round(diameters.length/2)],
			 pctl75: diameters[Math.round(3 * diameters.length/4)],
			 pctl100: diameters[diameters.length-1]
			});
	}
	else if (type === 'components')
	{
		graph.build_components();
		var component_sizes = [];
		graph.components.forEach(function(graph){
			component_sizes.push(Math.log(graph.length));
		});

		component_sizes.sort(function(a,b){return a-b});
		chart_data.push({
			 pctl25: component_sizes[Math.round(component_sizes.length/4)],
			 pctl50: component_sizes[Math.round(component_sizes.length/2)],
			 pctl75: component_sizes[Math.round(3 * component_sizes.length/4)],
			 pctl100: component_sizes[component_sizes.length-1]
			});
	}
	else
	{
		console.error("ERROR IN TYPE SELECTION");
	}

	//console.log('build time: ' + (performance.now()-a));
	return new Promise( function(resolve,reject){
		resolve(chart_data);
	});
}

TaxiChartDrawer.prototype.scalingFn = function(x)
{
	return d3.scale.linear().domain([0,this.max_value]).rangeRound([0,this.svg_height])(x);
}


TaxiChartDrawer.prototype.draw_chart = function(draw_marker,chart_data)
{
	var _this = this;
	var enterSelection = _this.svg.append('g').selectAll('rect').data(chart_data).enter();
	var width = 1;

	enterSelection	
		.append('rect')
		.attr({
			x:		function(d,i) { return draw_marker; },
			y:		function(d) {return (_this.svg_height - _this.scalingFn(d.pctl25))},
			width: width,
			height: function(d,i){return _this.scalingFn(d.pctl25)},
			fill: '#7f3fed'
		});
	enterSelection	
		.append('rect')
		.attr({
			x:		function(d,i) { return draw_marker; },
			y:		function(d) {return (_this.svg_height - _this.scalingFn(d.pctl50))},
			width: width,
			height: function(d,i){return _this.scalingFn(d.pctl50) - _this.scalingFn(d.pctl25)},
			fill: '#7db8ec'
		});
	enterSelection
		.append('rect')
		.attr({
			x:		function(d,i) { return draw_marker; },
			y:		function(d) {return (_this.svg_height - _this.scalingFn(d.pctl75))},
			width: width,
			height: function(d,i){return _this.scalingFn(d.pctl75)-_this.scalingFn(d.pctl50)},
			fill: '#a77eed'
		});
	enterSelection
		.append('rect')
		.attr({
			x:		function(d,i) { return draw_marker; },
			y:		function(d) {return (_this.svg_height - _this.scalingFn(d.pctl100))},
			width: width,
			height: function(d,i){return _this.scalingFn(d.pctl100)-_this.scalingFn(d.pctl75)},
			fill: '#b0d0ec'
		});
	enterSelection
		.append('rect')
		.attr({
			x:		function(d,i) { return draw_marker; },
			y:		function(d) {return (_this.svg_height - _this.scalingFn(d.mean))},
			width: width,
			height: function(d,i){return 1},
			fill: 'red'
		});

	return new Promise( function(resolve,reject){
		setTimeout(resolve(),20);
	});
}


