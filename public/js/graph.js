		// Find the distance (in metres) between two coordinates on the map
		function convertLLtoM(lat1, lon1, lat2, lon2) {
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
			var queue = [];
			var set = [];

			for (var i = 0; i < _graph_nodes.length; i++)
			{
				var current_graph = [];

				if (set.indexOf(_graph_nodes[i]) == -1)
				{
					queue.push(_graph_nodes[i]);
					set.push(_graph_nodes[i]);	
					current_graph.push(_graph_nodes[i]);
					while (queue.length > 0)
					{
						var q_head = queue.shift();
						q_head.neighbours.forEach(
							function(neighbour){
								if (set.indexOf(neighbour) == -1)
								{
									queue.push(neighbour);
									set.push(neighbour);
									current_graph.push(neighbour);
								}
							});
						if (queue.length == 0)
						{
							graphs.push(current_graph);
						}
					}
				}
			}
		}
