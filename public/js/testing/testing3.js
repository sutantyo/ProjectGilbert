
var A = [];
A[0] = [1,2,3,4,5,6,7,8,9];
A[1] = [10,11,12,13,14,15,16,17,18,19,20,21,22,23,24];

var counter = 0;
var active = 0;

var intervalId = setInterval(function(){

	if (counter >= (A[active].length))
	{
		active = (active + 1) % 2;
		if (A[active].length === 0)
			clearInterval(intervalId);
		counter = 0;
	}
	else
	{
		console.log(A[active][counter]);
		counter++;
	}

},200);

setTimeout(function(){A[0] = [];},1000);
