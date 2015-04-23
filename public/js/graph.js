function Graph(){
	this.nodes = [];
	this.edges = [];
	this.components = [];
}



		// Find the distance (in metres) between two coordinates on the map
Set.convertLLtoM = function(lat1, lon1, lat2, lon2) {
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
function convertMtoLL(m) {
	return (m * 0.00000893831118);
}



		// Graph-related codes

		var graphs = [];

		function _graph_findNeighbours()
		{
			for (var i = 0; i < _graph_nodes.length; i++)
			{
				for (var j = 0; j < _graph_nodes.length; j++)
				{
					if (i != j)
					{
						if (convertLLtoM(_graph_nodes[i].x,_graph_nodes[i].y,_graph_nodes[j].x,_graph_nodes[j].y) < coverageRadius)
						{
							if (_graph_nodes[i].neighbours.indexOf(_graph_nodes[j]) == -1)
							{
								_graph_nodes[i].neighbours.push(_graph_nodes[j]);
								_graph_edges.push({id: _graph_nodes[i].id + '-' + _graph_nodes[j].id,
																	 origin: _graph_nodes[i], 
																	 dest: _graph_nodes[j],
																	 path: [{x: _graph_nodes[i].x, y: _graph_nodes[i].y},
																	 				{x: _graph_nodes[j].x, y: _graph_nodes[j].y}]});
							}
						}
					}
				}
			}
		}

		function _graph_buildGraph()
		{
			// container for nodes that have been inspected (i.e. some other node's neighbour),
			// so that we don't make the same graph twice 
			var inspected_nodes = [];
			for (var i = 0; i < _graph_nodes.length; i++)
			{
				// container for nodes of the current graph that we're building
				var current_graph = [];

				// if node has not been inspected
				if (inspected_nodes.indexOf(_graph_nodes[i]) == -1)
				{
					var queue = [];
					// add the first node into the graph
					current_graph.push(_graph_nodes[i]);

					// start the BFS traversal
					queue.push(_graph_nodes[i]);
					inspected_nodes.push(_graph_nodes[i]);	
					while (queue.length > 0)
					{
						var q_head = queue.shift();
						q_head.neighbours.forEach(
							function(neighbour){
								if (inspected_nodes.indexOf(neighbour) == -1)
								{
									current_graph.push(neighbour);
									queue.push(neighbour);
									inspected_nodes.push(neighbour);
								}
							});
						if (queue.length == 0)
						{
							// if queue is empty, q_head is the last node, so push the
							// graph into the array of graphs
							graphs.push(current_graph);

							// find the diameter of the graph:
							// from q_head, the last node, do another BFS
							// ... we re-use the queue (since it is now empty), 
							// ... but need a new array to mark the inspected nodes
							if (current_graph.length == 1)	
								current_graph.diameter = 0;
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
										current_graph.diameter = diameter;
								}	
							}
						}
					}
				}
			}
		}
