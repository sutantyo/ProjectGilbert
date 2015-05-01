
		//function chartDrawer(start_time, end_time, type, interval, radius)
		function chartDrawer(start_time, end_time, type, interval,radius, width)
		{

			console.log('start time: ' + start_time);
			console.log('end time: ' + end_time);
			var chunk_size = 14400;
			var marker_start = 0;
			var marker_movement = chunk_size / interval * width;
			var current_time = start_time;


			//d3.json('/dataset/taxi_sf_epoch/time?start=' + current_time + '&end=' + (current_time + chunk_size), function(error,data)
			
			/*
			d3.json('/dataset/taxi_sf_epoch/time?start=' + current_time + '&end=' + (current_time + chunk_size), function(error,data)
			{
				if (error) return console.log('Error getting json data: ' + error);

				var _data = data;

				async.whilst( 
					function(){ return current_time <= end_time; },
					function(callback) {
						async.parallel([
							function(callback){ 
								//console.log('...processing data from ' + current_time);
								processData(_data, type, marker_start, marker_movement,current_time,interval,radius,width)
								marker_start = marker_start + marker_movement;
								callback(null,'one');
							},
							function(callback){ 
								current_time = current_time + chunk_size;
								if (current_time <= end_time)
								{
									d3.json('/dataset/taxi_sf_epoch/time?start=' + current_time + '&end=' + (current_time + chunk_size), function(error,data)
									{
										_data = data;
										//console.log('...obtained data from ' + current_time);
										callback(null,'two');
									});
								}
							}
							], 
							function(){
								callback();
							}
						);
					},
					function(err){
						if (err)
							console.log(err);
					}
				);
			//gatherData();
			}); // end first json request
			*/
		}// end chartDrawer

		function processData(data, type, marker_start, marker_movement,start_time,interval,radius,width)
		{
				var perfA = performance.now();

				//console.log("Called processData with params: " + marker_start + ', ' + type + ', ' + marker_movement + ', data-length: ' + data.length);
				var chart_data = [];
				// Now we loop through the json data to process it in a smaller interval, determined by the
				// variable 'data_collection_interval'. 
				// For example if the interval is 60 seconds, then we collect 60 seconds worth of data, 
				// create the graphs, and then record its properties. 

				for (var i = 0; i < marker_movement; i++)
				//for (var i = 0; i < 1; i++)
				{
					// collect data within data_collection_interval and store it in current_batch
					var current_batch = [];
					for (var j = 0; j < data.length; j++)
					{
						if ( data[j].time < (start_time + (i+1) * interval) )
							current_batch.push(data[j]);
						else
						{
							// if data[j] has exceeded the timestamp, remove all the previous entries from data
							data.splice(0,j);
							break;
						}
					}

					var graph = new Graph();
					var _duplicate_check = [];
					current_batch.forEach(function(datum){
						if (_duplicate_check[datum.id] !== 1)
						{
								graph.nodes.push({id: datum.id, x: Number(datum.x), y: Number(datum.y), neighbours: []});
								_duplicate_check[datum.id] = 1;
						}
					});
					graph.find_neighbours(radius);

					var _length = 0;

					// Calculate the chart data
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
				}
			
				var pctl100max = 0;
				chart_data.forEach(function(node){
					if (node.pctl100 > pctl100max)
						pctl100max = node.pctl100;
				});
				console.log('maximum value is ' + pctl100max);

				console.log("Drawing the data");
				//drawChartLineStyle(chart_svg.append('g'),400,marker_start,width,chart_data,100);
				drawChart(chart_svg.append('g'),400,marker_start,width,chart_data,100);

				var perfB = performance.now();
				console.log("Time taken: " + (perfB-perfA));
		}		


		function drawChartLineStyle(svg, svg_height, start_marker, width, chart_data, max_height)
		{
			var scale = d3.scale.linear()
				.domain([0,max_height])
				.rangeRound([0,svg_height])

			// Draw 100th percentile (i.e. max value)
			var line_fn_pctl100 = d3.svg.line()
														.x(function(d,i) {return start_marker+(0.0*width)+(i*width)})
														.y(function(d) {return svg_height - scale(d.pctl100)})
														.interpolate('linear');
			var chart_data_pctl100 = line_fn_pctl100(chart_data);
			chart_data_pctl100[0] = 'L';
			chart_data_pctl100 = 'M' + (start_marker+0.0*width) + ',' + svg_height + chart_data_pctl100;
			chart_data_pctl100 = chart_data_pctl100 + 'L' + (start_marker+((chart_data.length-1)*width)+(0.0*width)) + ',' + svg_height;
			chart_data_pctl100 = chart_data_pctl100 + 'L' + (start_marker+0.0*width) + ',' + svg_height;

			svg.append('path')
				.attr({
					d:	  chart_data_pctl100,
					x:		start_marker,
					y:		svg_height,
					fill: '#b0d0ec'
				})
				.style('stroke','#b0d0ec')
				.style('stroke-width',1)

			// Draw 75th percentile
			var line_fn_pctl75 = d3.svg.line()
														//.x(function(d,i) {return start_marker+(0.5*width)+(i*width)})
														.x(function(d,i) {return start_marker+(0.0*width)+(i*width)})
														.y(function(d) {return svg_height - scale(d.pctl75)})
														.interpolate('linear');
			var chart_data_pctl75 = line_fn_pctl75(chart_data);
			chart_data_pctl75[0] = 'L';
			chart_data_pctl75 = 'M' + (start_marker+0.0*width) + ',' + svg_height + chart_data_pctl75;
			chart_data_pctl75 = chart_data_pctl75 + 'L' + (start_marker+((chart_data.length-1)*width)+(0.0*width)) + ',' + svg_height;
			chart_data_pctl75 = chart_data_pctl75 + 'L' + (start_marker+0.0*width) + ',' + svg_height;

			//console.log(chart_data_pctl75);
			svg.append('path')
				.attr({
					d:	  chart_data_pctl75,
					x:		start_marker,
					y:		svg_height,
					fill: 'none'//'#a77eed'
				})
				.style('stroke','#a77eed')
				.style('stroke-width',1)

			// Draw median
			var line_fn_pctl50 = d3.svg.line()
														.x(function(d,i) {return start_marker+(0.0*width)+(i*width)})
														.y(function(d) {return svg_height - scale(d.pctl50)})
														.interpolate('linear');
			var chart_data_pctl50 = line_fn_pctl50(chart_data);
			chart_data_pctl50[0] = 'L';
			chart_data_pctl50 = 'M' + (start_marker+0.0*width) + ',' + svg_height + chart_data_pctl50;
			chart_data_pctl50 = chart_data_pctl50 + 'L' + (start_marker+((chart_data.length-1)*width)+(0.0*width)) + ',' + svg_height;
			chart_data_pctl50 = chart_data_pctl50 + 'L' + (start_marker+0.0*width) + ',' + svg_height;

			svg.append('path')
				.attr({
					d:	  chart_data_pctl50,
					x:		start_marker,
					y:		svg_height,
					fill: '#7db8ec'
				})
				.style('stroke','#7db8ec')
				.style('stroke-width',1)

			// Draw 25th percentil
			var line_fn_pctl25 = d3.svg.line()
														.x(function(d,i) {return start_marker+(0.0*width)+(i*width)})
														.y(function(d) {return svg_height - scale(d.pctl25)})
														.interpolate('linear');
			var chart_data_pctl25 = line_fn_pctl25(chart_data);
			chart_data_pctl25[0] = 'L';
			chart_data_pctl25 = 'M' + (start_marker+0.0*width) + ',' + svg_height + chart_data_pctl25;
			chart_data_pctl25 = chart_data_pctl25 + 'L' + (start_marker+((chart_data.length-1)*width)+(0.0*width)) + ',' + svg_height;
			chart_data_pctl25 = chart_data_pctl25 + 'L' + (start_marker+0.0*width) + ',' + svg_height;

			svg.append('path')
				.attr({
					d:	  chart_data_pctl25,
					x:		start_marker,
					y:		svg_height,
					fill: '#7f3fed'
				})
				.style('stroke','#7f3fed')
				.style('stroke-width',1)


			console.log(chart_data_pctl75);

		}


		function drawChart(svg, svg_height, start_marker, width, chart_data, max_height)
		{
			//console.log('in drawChart');
			console.log(start_marker/240);
			var scale = d3.scale.linear()
				.domain([0,max_height])
				.rangeRound([0,svg_height])

			var enterSelection =svg.selectAll('rect')
				.data(chart_data).enter()
			

			enterSelection	
				.append('rect')
				.attr({
					x:		function(d,i) { return start_marker + i * width},
					y:		function(d) {return (svg_height - scale(d.pctl25))},
					width: width,
					height: function(d,i){return scale(d.pctl25)},
					fill: '#7f3fed'
				});
			enterSelection	
				.append('rect')
				.attr({
					x:		function(d,i) { return start_marker + i * width},
					y:		function(d) {return (svg_height - scale(d.pctl50))},
					width: width,
					height: function(d,i){return scale(d.pctl50) - scale(d.pctl25)},
					fill: '#7db8ec'
				});
			enterSelection
				.append('rect')
				.attr({
					x:		function(d,i) { return start_marker + i * width},
					y:		function(d) {return (svg_height - scale(d.pctl75))},
					width: width,
					height: function(d,i){return scale(d.pctl75)-scale(d.pctl50)},
					fill: '#a77eed'
				});
			enterSelection
				.append('rect')
				.attr({
					x:		function(d,i) { return start_marker + i * width},
					y:		function(d) {return (svg_height - scale(d.pctl100))},
					width: width,
					height: function(d,i){return scale(d.pctl100)-scale(d.pctl75)},
					fill: '#b0d0ec'
				});
			enterSelection
				.append('rect')
				.attr({
					x:		function(d,i) { return start_marker + i * width},
					y:		function(d) {return (svg_height - scale(d.mean))},
					width: width,
					height: function(d,i){return 1},
					fill: 'red'
				});
		}




