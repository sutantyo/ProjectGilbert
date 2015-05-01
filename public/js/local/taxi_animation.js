

		function mainLoop()
		{
			_updatePoints(overlay);

			start_time = end_time+1;
			end_time = end_time + time_increments;
			currentTime = new Date(end_time*1000);
			d3.select('#info-time').text('  ' +	currentTime.toTimeString().substr(0,8));
		}	

		var chart_div = d3.select('#taxi-data');
		var chart_svg = chart_div.append('svg')
			.attr('height',400)
			.attr('width',1800)


		function _updatePoints(graph, overlay){
			d3.json('/dataset/taxi_sf_epoch/time?start=' + start_time + '&end=' + end_time, function(error,data)
				{
					//console.log('Frame: ' + frame + ' start time: ' + startTime);

					var _duplicate_check = [];
					data.forEach(function(datum){
						if (_duplicate_check.indexOf(datum.id) == -1)	
						{
								graph.nodes.push({id: datum.id, x: Number(datum.x), y: Number(datum.y), neighbours: []});
								_duplicate_check.push(datum.id);
						}
					});

					graph.find_neighbours(radius);
					graph.build_components();

					graph.components.forEach(function(graph,i){
						var list_of_node = '';
						graph.forEach(function(node){
							list_of_node = list_of_node + ' ' + node.id;
						});
						//console.log('Graph ' + i + ':' + list_of_node);
						//console.log('... diameter: ' + graph.diameter);
					});
					
					graph.components.forEach(function(graph,i){
						var graph_size = graph.length;
						var list_of_node = '';
						graph.forEach(function(node){
							list_of_node = list_of_node + ' ' + node.id;
							if (graph_size > 15)
								node.color = '#ff0000';
							else if (graph_size > 13)
								node.color = '#a81662';
							else if (graph_size > 9)
								node.color = '#c94b8c';
							else if (graph_size > 5)
								node.color = '#d870e6';
							else if (graph_size > 1)
								node.color = '#a370e6';
							else
								node.color = 'gray';
						});
						//console.log('Graph ' + i + ', size ' + graph.length + ' :' + list_of_node);
					});
					
					overlay.nodes = graph.nodes;
					overlay.edges = graph.edges;
					overlay.update();
			}); // end d3.json
		};


