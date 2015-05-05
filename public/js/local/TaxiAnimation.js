function TaxiAnimation(overlay, params){

	this.overlay = overlay;
	this.radius = params.radius;

	this.chunk_start_time = this.current_time =  params.animation_start_time;
	this.chunk_size = params.data_chunk
	this.chunk_end_time = this.chunk_start_time + this.chunk_size;

	this.data_url = params.data_url;

	this.end_time = params.animation_end_time;
	this.animation_step = params.animation_step;
	this.stop_animation = false;

	this.active_data = []; 
	this.next_set_of_data = [];

}


TaxiAnimation.prototype.animation_loop = function()
{
	console.log('started animation_loop');
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

	var graph_promise = TaxiAnimation.build_graph(current_batch,_this.radius);	

	graph_promise.then(function(returned_graph){
		//console.log(msg + ' up to ' + _this.current_time);
		var animation_promise = TaxiAnimation.draw_graph(returned_graph,_this.overlay);
		animation_promise
			.then(function(msg){
				console.log(msg + ' up to ' + _this.current_time);
				if (_this.stop_animation || _this.current_time >= _this.end_time)
					return;
				else
				{
					return _this.animation_loop();
				}
			});
	});
};


TaxiAnimation.build_graph = function(data,radius)
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
	graph.find_neighbours_and_edges(radius);
	graph.build_components();

	/*
	graph.components.forEach(function(component){
		if (component.length > 15)
			node.color = '#ff0000';
		else if (component.length > 13)
			node.color = '#a81662';
		else if (component.length > 9)
			node.color = '#c94b8c';
		else if (component.length > 5)
			node.color = '#d870e6';
		else if (component.length > 1)
			node.color = '#a370e6';
		else
			node.color = 'gray';
	});
	*/

	console.log('build time: ' + (performance.now()-a));
	return new Promise( function(resolve,reject){
		resolve(graph);
	});
}

TaxiAnimation.draw_graph = function(graph,overlay)
{
	var a = performance.now();
	overlay.nodes = graph.nodes;
	console.log(overlay.nodes);
	overlay.edges = graph.edges;
	overlay.update();
	console.log('draw time: ' + (performance.now()-a));
	return new Promise( function(resolve,reject){
		setTimeout(function(){resolve()},1000);
	});
}

