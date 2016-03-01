function TaxiAnimation(overlay, params){

	this.overlay = overlay;
	this.radius = params.radius;

	this.chunk_start_time = this.current_time =  params.animation_start_time;
	this.chunk_size = params.data_chunk
	this.chunk_end_time = this.chunk_start_time + this.chunk_size;
	this.time_offset = params.time_offset;

	this.data_url = params.data_url;

	this.end_time = params.animation_end_time;
	this.animation_step = params.animation_step;
	this.stop_animation = false;

	this.active_data = []; 
	this.next_set_of_data = [];

	this.current_data = [];

	this.infected = [];

	this.x_min = params.x_min;
	this.x_max = params.x_max;
	this.y_min = params.y_min;
	this.y_max = params.y_max;
}


TaxiAnimation.prototype.animation_loop = function()
{
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

	_this.current_time = _this.current_time + _this.animation_step;
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


		_this.current_data = current_batch;

	//setTimeout(function(){
		_this.build_graph().then(function(returned_graph){
			var ct = new Date(_this.current_time*1000);
			ct.setHours(ct.getHours()+this.time_offset);
			d3.select('#map-info-time').text(ct.toUTCString().slice(0,-4));
			var animation_promise = TaxiAnimation.draw_graph(returned_graph,_this.overlay);
			animation_promise
				.then(function(msg){
					if (_this.stop_animation || _this.current_time >= _this.end_time)
					{
						return new Promise( function(resolve,reject){
							resolve('Stopped animation');
						});
					}
					else
					{
						return _this.animation_loop();
					}
				});
		});
	//},0);
};


TaxiAnimation.prototype.build_graph = function()
{
	var _this = this;
	var a = performance.now();
	var graph = new Graph();
	var _duplicate_check = [];

	_this.current_data.forEach(function(datum){
		if ( _this.x_min <= datum.x && datum.x <= _this.x_max &&
				 _this.y_min <= datum.y && datum.y <= _this.y_max)
		{
			if (_duplicate_check[datum.id] !== 1)
			{
				_duplicate_check[datum.id] = 1;
				if (_this.infected[datum.id] === true)
				{
					graph.nodes.push({id: datum.id, x: Number(datum.x), y: Number(datum.y), neighbours: [], infected: true});
				}
				else
				{
					graph.nodes.push({id: datum.id, x: Number(datum.x), y: Number(datum.y), neighbours: [], infected: false});
				}
			}
		}
	});
	graph.find_neighbours_and_edges(_this.radius);
	graph.build_components();

	graph.components.forEach(function(component){

		if (component.infected)
			component.forEach(function(node){
				node.color = '#8de854';
				_this.infected[node.id] = true;
			});
		else if (component.length > 20)
			component.forEach(function(node){
				//node.color = '#9e38ff';
				node.color = '#a50f15';
				//node.color = '#ff0000';
			});
		else if (component.length > 10)
			component.forEach(function(node){
				node.color = '#de2d26';
				//node.color = '#a81662';
			});
		else if (component.length > 5)
			component.forEach(function(node){
				node.color = '#fb6a4a';
			});
		/*
		else if (component.length > 5)
			component.forEach(function(node){
				node.color = '#d870e6';
			});
		*/
		else if (component.length > 1)
			component.forEach(function(node){
				//node.color = '#a370e6';
				node.color = '#fcae91'
			});
		else
			component.forEach(function(node){
				node.color = '#fcae91';
			});
	});


	return new Promise( function(resolve,reject){
		//console.log('build time: ' + (performance.now()-a));
		resolve(graph);
	});
}

TaxiAnimation.draw_graph = function(graph,overlay)
{
	//console.log('calling draw graph');
	var a = performance.now();
	overlay.nodes = graph.nodes;
	overlay.edges = graph.edges;
	overlay.update();
	return new Promise( function(resolve,reject){
		setTimeout(function(){
			//console.log('draw time: ' + (performance.now()-a));
			resolve('...finished drawing')},1000);
	});
}


TaxiAnimation.prototype.add_listeners_on_circles = function()
{
	var _this = this;
	if (_this.overlay.main_svg)
	{
		_this.overlay.main_svg.selectAll('circle').style('cursor','crosshair')
			.on('click',function(d){
				if (_this.infected[d.id])
				{
					_this.infected[d.id] = false;
					_this.build_graph().then(function(returned_graph){
						TaxiAnimation.draw_graph(returned_graph,_this.overlay);
					});
				}
				else
				{
					_this.infected[d.id] = true;
					_this.build_graph().then(function(returned_graph){
						TaxiAnimation.draw_graph(returned_graph,_this.overlay);
					});
				}
			});
	}
}

TaxiAnimation.prototype.remove_listeners_on_circles = function()
{
	var _this = this;
	if (_this.overlay.main_svg)
	{
		_this.overlay.main_svg.selectAll('circle').style('cursor','crosshair')
			.on('click',null)
	}
}
