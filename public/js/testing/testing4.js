function add(xPromise,yPromise){
	
	return Promise.all([xPromise,yPromise])
		.then(function(values){
			return values[0] + values[1];
	});
}


function fetchX(){
	return new Promise(function(fulfill,reject){
		setTimeout(function(){
			fulfill(10);
		},2000);
	});
}

function fetchY(){
	return new Promise(function(fulfill,reject){
		setTimeout(function(){
			fulfill(20);
		},100);
	});
}


add( fetchX(), fetchY() )
	.then( function(sum){
		console.log(sum);
	});
