function Graph(){
	this.nodes = [];
	this.components = [];
	this.edges = [];
	this.triangles = [];
}

		// Find the distance (in metres) between two coordinates on the map
Graph.convertLLtoM = function(lat1, lon1, lat2, lon2) {
	var R = 6378.137
	var a =
		 0.5 - Math.cos((lat2 - lat1) * Math.PI / 180)/2 +
		 Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
		 (1 - Math.cos((lon2 - lon1) * Math.PI / 180))/2;

	return 1000 * R * 2 * Math.asin(Math.sqrt(a));
}

		// Convert a distance in metres into change in longitudinal coordinate
		//
		// We are doing something very lazy here: at the equator, 1 longitudinal degree
		// is roughly 111,320 metres, so conversely, 1 metre is about 0.0000089831118
Graph.convertMtoLL = function(m){
	return (m * 0.00000893831118);
}

Graph.prototype.sort_nodes = function()
{
	nodes.sort(function(a,b){return a-b});
}

// Given a graph, go through the set of nodes, and for each node, see if there
// are any other nodes located within the radius
Graph.prototype.find_neighbours = function(radius)
{
			for (var i = 0; i < this.nodes.length; i++)
			{
				for (var j = 0; j < this.nodes.length; j++)
				{
					if ( (i != j) && (Graph.convertLLtoM(this.nodes[i].x,this.nodes[i].y,this.nodes[j].x,this.nodes[j].y) < radius) )
					{
							if (this.nodes[i].neighbours.indexOf(this.nodes[j]) == -1)
								this.nodes[i].neighbours.push(this.nodes[j]);
					}
				}// end for j
			}// end for i
}

Graph.prototype.find_neighbours_and_edges = function(radius)
{
	for (var i = 0; i < this.nodes.length; i++)
	{
		for (var j = 0; j < this.nodes.length; j++)
		{
				if ( (i != j) && (Graph.convertLLtoM(this.nodes[i].x,this.nodes[i].y,this.nodes[j].x,this.nodes[j].y) < radius) )
				{
						if (this.nodes[i].neighbours.indexOf(this.nodes[j]) == -1)
						{
							this.nodes[i].neighbours.push(this.nodes[j]);
							if (this.nodes[i].id < this.nodes[j].id)
							{
								this.edges.push({id: this.nodes[i].id + '-' + this.nodes[j].id,
																	 origin: this.nodes[i],
																	 dest: this.nodes[j],
																	 path: [{x: this.nodes[i].x, y: this.nodes[i].y},
																					{x: this.nodes[j].x, y: this.nodes[j].y}]});
							}
						}
				}
		}// end for j
	}// end for i
}



Graph.prototype.build_triangles = function()
/* Go through the graph and populate the array 'this.triangles' with arrays of nodes that
 * form a triangle.
 * We use the node-iterator algorithm as described by Algorithm 1 in
 *   Schank, Wagner - Finding, counting and listing all triangles in large graphs, an experimental study
 */
{
	var a = performance.now();
	var _this = this;
	if (_this.nodes.length === 0)
		return
	else if (_this.components.length === 0)
		_this.build_components();

	_this.components.forEach(function(component){
		component.sort(function(a,b){
			if (a.id > b.id)
				return 1;
			if (a.id <= b.id)
				return -1;
		});
		if (component.length > 2)
		{
			var neighbours = [];
			component.forEach(function(node){
				neighbours[node.id] = [];
			});
			for (var i = 0; i < component.length; i++)
			{
				for (var j = 0; j < component[i].neighbours.length; j++)
				{
					if (component[i].id < component[i].neighbours[j].id)
					{
						neighbours[component[i].id].forEach(function(node1){
							neighbours[component[i].neighbours[j].id].forEach(function(node2){
								if (node1 === node2)
								{
									var current_triangle = [];
									current_triangle.push(node1);
									current_triangle.push(component[i]);
									current_triangle.push(component[i].neighbours[j]);
									_this.triangles.push(current_triangle);
								}
							});
						});

						neighbours[component[i].neighbours[j].id].push(component[i]);
					}
				}
			}
		}
	});
	//console.log(this.triangles.length);
	//console.log('Time taken: ' + (performance.now()-a));
}


Graph.prototype.build_components = function()
{
	// Use inspected_nodes to mark the nodes that we have used to form a component, e.g.
	// if we are building a component that includes node A, then put all A's neighbours in
	// inspected_nodes so that we don't process them later (and thus making the same component twice)
	var inspected_nodes = [];

	// Loop through all the nodes
	for (var i = 0; i < this.nodes.length; i++)
	{
		// Container to hold the nodes of the component we're working on
		var current_component = [];

		// If node has not been inspected ...
		if (inspected_nodes.indexOf(this.nodes[i]) == -1)
		{
			// ... add it to the current_component
			current_component.push(this.nodes[i]);
			if (this.nodes[i].infected)
			{
				current_component.infected = true;
			}

			// start the BFS traversal
			var queue = [];
			queue.push(this.nodes[i]);
			inspected_nodes.push(this.nodes[i]);
			while (queue.length > 0)
			{
				var q_head = queue.shift();
				q_head.neighbours.forEach(
					function(neighbour){
						if (inspected_nodes.indexOf(neighbour) == -1)
						{
							if (neighbour.infected)
							{
								current_component.infected = true;
							}
							current_component.push(neighbour);
							queue.push(neighbour);
							inspected_nodes.push(neighbour);
						}
					});
				if (queue.length == 0)
				{
					// if queue is empty, q_head is the last node, so push the
					// component into the array of components

					this.components.push(current_component);

					// find the diameter of the component
					// from q_head, the last node, do another BFS
					// ... we re-use the queue (since it is now empty),
					// ... but need a new array to mark the inspected nodes
					if (current_component.length == 1)
						current_component.diameter = 0;
					else
					{
						var diameter_inspected_nodes = [];
						var diameter = -1;

						queue.push([q_head]);
						diameter_inspected_nodes.push(q_head);

						while(queue.length > 0)
						{
							diameter++;
							var next_group = [];

							q_head = queue.shift();
							q_head.forEach(function(node){
									node.neighbours.forEach(function(neighbour){
										if (diameter_inspected_nodes.indexOf(neighbour) == -1)
										{
											next_group.push(neighbour);
											diameter_inspected_nodes.push(neighbour);
										}
									});
							});
							if (next_group.length > 0)
								queue.push(next_group);

							if (queue.length == 0)
								current_component.diameter = diameter;
						}
					}
				}
			}
		}
	}
}
