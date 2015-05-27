
function TaxiData(params){

	console.log("created new TaxiData");

	this.start_time = params.start_time;
	this.current_time = params.start_time;
	this.end_time = params.end_time;

	this.chunk_start_time = params.start_time;
	this.chunk_size = params.data_chunk_size;
	this.chunk_end_time = this.chunk_start_time + this.chunk_size;


	this.type = params.type;
	this.radius = params.radius;
	this.interval = params.interval;

	this.data_url = params.data_url;

	this.active_data = [];
	this.next_set_of_data = [];

	this.x_min = params.x_min;
	this.x_max = params.x_max;
	this.y_min = params.y_min;
	this.y_max = params.y_max;
	
	this.data_storage = [];
	this.data_type;

	this.enable_chart_drawing = false;
	this.export_type = params.export_type;
	this.progress_bar_id = params.progress_bar_id;
	this.download_btn_id = params.download_btn_id;
	this.export_data;

	console.log('in constructor: ' + this.download_btn_id);

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
		this.svg_width = params.svg_width;

		var x = d3.time.scale();
		x.domain([new Date(params.chart_start_time*1000), new Date(params.chart_end_time*1000)])
		 .range([0,params.svg_width]);

		var xAxis = d3.svg.axis().scale(x).ticks(d3.time.minutes, 60);

		params.svg.append('g').call(xAxis);
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

	// Increment the time
	_this.current_time = _this.current_time + _this.interval;

	// If we get to the end of a data chunk, then replace (active_data) with the (next_set_of_data),
	// then replace the (next_set_of_data) with a d3.json call
	if (_this.current_time === _this.chunk_end_time)
	{
		console.log("Test: " + _this.percentage_progress(_this.current_time));
		if(_this.enable_chart_drawing === false)
		{
			var pct = _this.percentage_progress(_this.current_time);
			console.log("IN HERE " + pct);
			d3.select('#'+_this.progress_bar_id).attr('aria-value-now',pct);
			d3.select('#'+_this.progress_bar_id).style('width',pct+'%');
			d3.select('#'+_this.progress_bar_id).text(pct+'%');
		}
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

	// Use setTimeout to ensure this process do not 'freeze' the browser
	setTimeout(function(){
		// Construct the graph, and wait until it returns the graph, then
		// process the graph to 
		var graph_promise;
		graph_promise = _this.build_graph(current_batch);
		graph_promise.then(function(chart_data){
			if (_this.enable_chart_drawing)	
			{
				var draw_chart_promise = _this.draw_chart(_this.marker++,chart_data);
				draw_chart_promise.then(function(msg){
						if (_this.paused || _this.current_time >= _this.end_time)
						{
							console.log('Ended because ' + _this.paused + ' or ' + _this.current_time);

						}
						else
						{
							return _this.chart_drawing_loop();
						}
					});
			}
			else
			{
				if (_this.paused || _this.current_time >= _this.end_time)
				{
					if (_this.export_type === 'json')
						return _this.export_to_JSON();
					else if (_this.export_type === 'csv')
						return _this.export_to_CSV();
				}
				else
					return _this.chart_drawing_loop();
			}
		});	
	},0);
}

TaxiData.prototype.export_to_JSON = function(){
	//var export_string = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(export_data));
	var _this = this;
	_this.export_data = JSON.stringify(_this.data_storage);
	d3.select('#'+_this.download_btn_id).attr('disabled',null);
}

TaxiData.prototype.export_to_CSV = function(){
	var _this = this;
	//var export_string = 'data:text/csv;charset=utf-8,';

	var export_string = '';
	_this.data_storage[0].forEach(function(object){
		var objectString = '';
		for(var key in object) 
		{
			if(object.hasOwnProperty(key))
				objectString = objectString + key + ',';
		}
		objectString = objectString.slice(0,-1);
		export_string = export_string + objectString + '\n';
	});

	_this.data_storage.forEach(function(row){
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
	
	_this.export_data = export_string;
	console.log('hmmmm');
	d3.select('#'+_this.download_btn_id).attr('disabled',null);
	/*
	var encodedUri = encodeURI(export_string);
	window.open(encodedUri);
	*/
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
		chart_data.push({count: graph.components.length});
	}
	else if (type === 'no_of_triangles')
	{
		_this.data_type = 'count_type';
		graph.build_components();
		graph.build_triangles();
		chart_data.push({count: graph.triangles.length});
	}
	else
	{
		console.error("Error in type selection (or not implemented yet)");
		alert("Error in type selection (or not implemented yet)");
	}

	if (_this.data_type === 'quartile_type')
	{
		collected_data.sort(function(a,b){return a-b});
		chart_data.push({
			 pctl25 : collected_data[Math.round(collected_data.length/4)],
			 pctl50 : collected_data[Math.round(collected_data.length/2)],
			 pctl75 : collected_data[Math.round(3 * collected_data.length/4)],
			 pctl100: collected_data[collected_data.length-1],
			 mean		: collected_data_average/collected_data.length
		});
	}

	_this.data_storage.push(chart_data);	
	return new Promise( function(resolve,reject){
		resolve(chart_data);
	});
}

TaxiData.prototype.scalingFn = function(x)
{
	return d3.scale.linear().domain([0,this.max_value]).rangeRound([0,this.svg_height])(x);
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
	}
	else if (_this.data_type === 'count_type')
	{
		enterSelection
			.append('rect')
			.attr({
				x:		function(d,i) { return draw_marker; },
				y:		function(d) {return (_this.svg_height - _this.scalingFn(d.count))},
				width: width,
				height: function(d,i){return _this.scalingFn(d.count)},
				fill: '#b0d0ec'
			});

	}

	return new Promise( function(resolve,reject){
		resolve();
	});
}


