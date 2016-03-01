
function TaxiData(params)
{
	console.log("created new TaxiData");

	this.start_time = params.start_time;
	this.current_time = params.start_time;
	this.end_time = params.end_time;
	this.time_offset = params.time_offset;

	this.chunk_start_time = params.start_time;
	this.chunk_size = params.data_chunk_size;
	this.chunk_end_time = this.chunk_start_time + this.chunk_size;


	this.type = params.type;
	this.radius = params.radius;
	this.interval = params.interval;

	this.data_url = params.data_url;

	this.active_data = params.active_data;
	this.next_set_of_data = params.next_set_of_data;

	this.x_min = params.x_min;
	this.x_max = params.x_max;
	this.y_min = params.y_min;
	this.y_max = params.y_max;

	this.data_storage = [];
	this.data_type;

	this.enable_chart_drawing = false;
	this.callback = params.callback_fn;
	this.update 	= params.update_fn;
	this.export_data;

	// These parameters are used only when drawing charts, and are
	// undefined otherwise
	if (params.draw === true)
	{
		this.enable_chart_drawing = true;

		this.max_value = params.data_max_value;
		this.marker = 0;

		this.svg = params.svg;
		this.svg_axis = params.svg_axis;
		this.svg_height = params.svg_height;
		this.svg_top_offset = params.svg_top_offset;
		this.svg_width = params.svg_width;

		var _this = this;
		var scale_start_time = new Date(params.start_time*1000);
		console.log('DEBUG ' + scale_start_time.getHours());
		scale_start_time.setHours(scale_start_time.getHours()-scale_start_time.getTimezoneOffset()-_this.time_offset);
		var scale_end_time = new Date(params.end_time*1000);
		scale_end_time.setHours(scale_end_time.getHours()-scale_end_time.getTimezoneOffset()-_this.time_offset);
		console.log(scale_start_time);
		console.log(scale_end_time);
		var x = d3.time.scale()
		 .domain([scale_start_time,scale_end_time])
		 .range([0,params.svg_width]);
		var xAxis = d3.svg.axis().scale(x).ticks(d3.time.minutes, 60);

		_this.svg.append('g')
			.call(xAxis);

		var y = d3.scale.linear().domain([0,_this.max_value]).range([_this.svg_height,0]);
		var yAxis = d3.svg.axis().scale(y).ticks(5).orient('left');

		_this.svg_axis.append('g')
			.call(yAxis);
	}

	this.paused = false;

}

TaxiData.prototype.stop = function()
{
	this.paused = true;
}

TaxiData.prototype.start = function()
{
	this.paused = false;
	this.chart_drawing_loop();
}

TaxiData.prototype.percentage_progress = function(current_time)
{
	var _this = this;
	return d3.scale.linear().domain([_this.start_time,_this.end_time]).rangeRound([0,100])(current_time);
}

TaxiData.prototype.chart_drawing_loop = function()
{
	var _this = this;

	// Extract the data between (current_time) and (current_time+interval):
	// ... Start from the beginning of (active_data) array until the datum's time is
	// ... greater than (current_time+interval), pushing each datum into the current_batch
	// ... array.
	// ... Once a datum's time is greater than (current_time+interval), break, and splice
	// ... the data that has extracted so far
	var current_batch = [];
	var i = 0;
	while (i < _this.active_data.length)
	{
		if (_this.active_data[i].time < (_this.current_time + _this.interval))
			current_batch.push(_this.active_data[i]);
		else
		{
			_this.active_data.splice(0,i);
			break;
		}
		i++;
	}
	if (i === _this.active_data.length)
		_this.active_data = [];

	// Increment the time
	_this.current_time = _this.current_time + _this.interval;

	// If we get to the end of a data chunk, then replace (active_data) with the (next_set_of_data),
	// then replace the (next_set_of_data) with a d3.json call
	if (_this.current_time === _this.chunk_end_time)
	{
		if(_this.enable_chart_drawing === false)
		{
			var pct = _this.percentage_progress(_this.current_time);
			_this.update(pct);
		}
		_this.active_data = _this.next_set_of_data;
		_this.chunk_end_time = _this.chunk_end_time + _this.chunk_size;
		d3.json(_this.data_url + 'time?start=' + (_this.current_time+_this.chunk_size) + '&end=' + (_this.current_time+2*_this.chunk_size), function(error,data){
			if (error){
				alert('Error obtaining data from ' + start_time + ' to ' + end_time);
				return;
			}
			else
			{
				_this.next_set_of_data = data;
			}
		});
	}

	// Use setTimeout to ensure this process do not 'freeze' the browser
	setTimeout(function(){
		// Construct the graph, and wait until it returns the graph, then
		// process the graph to
		var graph_promise;
		graph_promise = _this.build_graph(current_batch);
		graph_promise.then(function(chart_data){
			if (_this.enable_chart_drawing)
			{
				_this.marker = _this.marker + 1;
				var draw_chart_promise = _this.draw_chart(_this.marker,chart_data);
				draw_chart_promise.then(function(msg){
						if (_this.paused || _this.current_time >= _this.end_time)
							_this.callback();
						else
							return _this.chart_drawing_loop();
					});
			}
			else
			{
				if ( _this.paused || _this.current_time >= _this.end_time)
					_this.callback();
				else
					return _this.chart_drawing_loop();
			}
		});
	},0);
}


TaxiData.prototype.build_graph = function(data)
{
	var a = performance.now();
	var _this = this;
	var graph = new Graph();
	var _duplicate_check = [];

	var type = _this.type;
	var radius = _this.radius;


	data.forEach(function(datum){
		if ( _this.x_min <= datum.x && datum.x <= _this.x_max &&
				 _this.y_min <= datum.y && datum.y <= _this.y_max)
		{
			if (_duplicate_check[datum.id] !== 1)
			{
				graph.nodes.push({id: datum.id, x: Number(datum.x), y: Number(datum.y), neighbours: []});
				_duplicate_check[datum.id] = 1;
			}
		}
	});
	graph.find_neighbours(radius);

	/*
	graph.nodes.forEach(function(node){
		console.log(node.neighbours.length);
	});
	*/

	// There are two types of data we are interested in:
	// ... 1. Mean-median with percentiles (25th, 75th, max value), e.g. for degrees, diameters.
	// ...    Let us call this the mean-median type.
	// ... 2. Total count, e.g for number of triangles, and number of components.
	// ...    Let us call this the counting type.
	// ... Therefore we separate the data collection process depending on the type of data that
	// ... we are going to process.
	// ...
	// ... If you want to add a new type of data to process, then see if you can generalise it to fit
	// ... into one of the two types, or simply make a new one if you can't.
	// ... The idea is to extract data from the graph and put it inside (collected_data)
	// ... FINISH THIS

	var collected_data = [];
	var collected_data_average = 0;
	var chart_data = [];

	if (type === 'degrees')
	{
		_this.data_type = 'quartile_type';
		graph.nodes.forEach(function(node){
			collected_data.push(node.neighbours.length);
			collected_data_average = collected_data_average + node.neighbours.length;
		});
	}
	else if (type === 'diameters')
	{
		_this.data_type = 'quartile_type';
		graph.build_components();
		graph.components.forEach(function(component){
			collected_data.push(component.diameter);
			collected_data_average = collected_data_average + component.diameter
		});
	}
	else if (type === 'component_sizes')
	{
		_this.data_type = 'quartile_type';
		graph.build_components();
		graph.components.forEach(function(component){
			collected_data.push(component.length);
			collected_data_average = collected_data_average + component.length;
		});
	}
	else if (type === 'no_of_components')
	{
		_this.data_type = 'count_type';
		graph.build_components();
		chart_data.push({
			time : _this.current_time,
			count: graph.components.length
		});
	}
	else if (type === 'no_of_triangles')
	{
		_this.data_type = 'count_type';
		graph.build_components();
		graph.build_triangles();
		chart_data.push({
			time : _this.current_time,
			count: graph.triangles.length
		});
	}
	else
	{
		console.error("Error in type selection (or not implemented yet)");
		alert("Error in type selection (or not implemented yet)");
	}

	if (_this.data_type === 'quartile_type')
	{
		if (collected_data.length < 1)
			collected_data.push(0);
		else
			collected_data.sort(function(a,b){return a-b});

		//console.log(collected_data);
		var quartiles = find_quartiles(collected_data,false)

		chart_data.push({
			 time   : _this.current_time,
			 pctl25 : quartiles.pctl25,
			 pctl50 : quartiles.pctl50,
			 pctl75 : quartiles.pctl75,
			 pctl100: collected_data[collected_data.length-1],
			 mean		: collected_data_average/collected_data.length
		});
	}

	_this.data_storage.push(chart_data[0]);
	return new Promise( function(resolve,reject){
		resolve(chart_data);
	});
}

TaxiData.prototype.scalingFn = function(x)
{
	return d3.scale.linear().domain([0,this.max_value]).rangeRound([0,this.svg_height])(x);
}


TaxiData.prototype.draw_from_data = function(divname,height)
{
	var _this = this;
	_this.svg_height = height;

	chart_div = d3.select('#'+divname);
	var chart_svg = chart_div.append('svg')
		.attr('height',height)
		.attr('width',_this.data_storage.length)

	_this.max_value = 0;
	for (var i = 0; i < _this.data_storage.length; i++)
	{
		if (_this.data_storage[i].pctl100 > _this.max_value)
			_this.max_value = _this.data_storage[i].pctl100;
	}

	console.log(_this.max_value);

	chart_svg.selectAll('rect').data(_this.data_storage).enter().append('rect')
		.attr({
			x: 	function(d,i){return i},
			y:	function(d){return _this.svg_height - _this.scalingFn(d.pctl100) },
			width: 1,
			height: function(d){return _this.scalingFn(d.pctl100)},
			fill: '#7f3f3d'
		});
}

TaxiData.prototype.draw_chart = function(draw_marker,chart_data)
{
	var _this = this;
	var enterSelection = _this.svg.append('g').selectAll('rect').data(chart_data).enter();



	var width = 1;

	if (_this.data_type === 'quartile_type')
	{
		enterSelection
			.append('rect')
			.attr({
				x:		function(d,i) { return draw_marker; },
				y:		function(d)
					{return Math.max(_this.svg_height-_this.scalingFn(d.pctl25),_this.svg_top_offset)},
				width: width,
				height: function(d,i){return _this.scalingFn(d.pctl25)},
				fill: '#7f3fed'
			});
		enterSelection
			.append('rect')
			.attr({
				x:		function(d,i) { return draw_marker; },
				y:		function(d)
					{return Math.max(_this.svg_height-_this.scalingFn(d.pctl50),_this.svg_top_offset)},
				width: width,
				height: function(d,i){return _this.scalingFn(d.pctl50) - _this.scalingFn(d.pctl25)},
				fill: '#7db8ec'
			});
		enterSelection
			.append('rect')
			.attr({
				x:		function(d,i) { return draw_marker; },
				y:		function(d)
					{return Math.max(_this.svg_height-_this.scalingFn(d.pctl75),_this.svg_top_offset)},
				width: width,
				height: function(d,i){return _this.scalingFn(d.pctl75)-_this.scalingFn(d.pctl50)},
				fill: '#a77eed'
			});
		var div = d3.select('#taxi-chart').append("div")
			.attr('class', 'tooltip')
			.style("opacity", 0);
		enterSelection
			.append('rect')
			.attr({
				x:		function(d,i) { return draw_marker; },
				y:		function(d) {
					//console.log('y: ' + Math.max(_this.svg_height + _this.scalingFn(d.pctl100),_this.svg_top_offset));
					return (Math.max(_this.svg_height - _this.scalingFn(d.pctl100), _this.svg_top_offset))},
				width: width,
				height: function(d,i){return _this.scalingFn(d.pctl100)-_this.scalingFn(d.pctl75)},
				fill: '#b0d0ec'
			});


		enterSelection
			.append('rect')
			.attr({
				x:		function(d,i) { return draw_marker; },
				y:		function(d) {return (_this.svg_height + _this.svg_top_offset - _this.scalingFn(d.mean))},
				width: width,
				height: function(d,i){return 1},
				fill: 'red'
			});
	}
	else if (_this.data_type === 'count_type')
	{
		enterSelection
			.append('rect')
			.attr({
				x:		function(d,i) { return draw_marker; },
				y:		function(d) {return (_this.svg_height + _this.svg_top_offset - _this.scalingFn(d.count))},
				width: width,
				height: function(d,i){return _this.scalingFn(d.count)},
				fill: '#b0d0ec'
			});

	}

	return new Promise( function(resolve,reject){
		resolve();
	});
}

function find_quartiles(array,stop)
{
	var pctl25, pctl50, pctl75, n;

	if (array.length === 1)
		return {pctl25: array[0], pctl50: array[0], pctl75: array[0]};

	if (array.length % 2 === 0)
	{
		n = (array.length-2)/2;
		pctl50 = (array[n] + array[n+1])/2;
		if (!stop)
		{
		  pctl25 = find_quartiles(array.slice(0,n+1),true);
		  pctl75 = find_quartiles(array.slice(n+1,array.length),true);
			return {pctl25: pctl25, pctl50: pctl50, pctl75: pctl75};
		}
		else
			return pctl50;
	}
	else
	{
		n = (array.length-1)/2;
		pctl50 = (array[n]);
		if (!stop)
		{
		  pctl25 = find_quartiles(array.slice(0,n),true);
		  pctl75 = find_quartiles(array.slice(n+1,array.length),true);
			return {pctl25: pctl25, pctl50: pctl50, pctl75: pctl75};
		}
		else
			return pctl50;
	}
}
