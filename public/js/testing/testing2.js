
function add(getX,getY,cb){
	var x, y;
	getX(function(xVal){
		console.log('in getX');
		x = xVal;
		if (y != undefined){
			cb (x+y);
		}
	});
	getY(function(yVal){
		console.log('in getY');
		y = yVal;
		if (x != undefined){
			cb (x+y);
		}
	});
}

var fetchX = function(x){setTimeout(function(){x(7)},2000)};
var fetchY = function(y){y(3)};

add(fetchX,fetchY,function(sum){
	console.log(sum);
});




