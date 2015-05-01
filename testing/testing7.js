/*
function *foo(){
	var x = yield 2;
	z++;
	console.log('z is ' + z);
	yield;
	var y = yield(x);
	console.log(x,y,z);
}

var z = 1;
var it1 = foo();
var it2 = foo();

console.log("Calling next, getting value");
console.log(it1.next().value);
console.log(it2.next().value);

console.log("Calling next");
it1.next();
it2.next();
*/

var counter = 0;

loop();



function loop()
{
	console.log(counter);
	if (counter++ == 10)
		return;
	var it = print();

	var temp;
	
	console.log('First call:');
	console.log(it.next().value);

	var promA = getX();
	var promB = getY();
	
	promA.then(function(x){
		console.log('Second call: sending x: ' + x);
		console.log(it.next(x).value);
	});


	/*
	promA.then(function(){
			getY().then(function(x){
			console.log('Got Y, it is ' + x);
			console.log(it.next(x).value);	
			});
		});
	*/


	Promise.all([promA,promB])
		.then(function(msgs){
			console.log('Third call: sending y: ' + msgs);
			return (it.next(msgs[1]).value);	
		})
		.then(function(msg){
			console.log(msg)
			loop();
		});
}

/*
var p1 = getX();
var p2 = getY();

Promise.all([p1,p2])
	.then(function(msgs){
		return msgs[0] + ' and ' +  msgs[1] })
	.then(function(msg){
		console.log(msg);
	});
	*/


var z = 0;

function *print(){
	var x;
	var y;
	z++;

	x = yield ('waiting for x');
	console.log('received x, now waiting for y');
	y = yield ('waiting for y');

	return ('z: ' + z + ' x+y: ' + x+y);
}

var x1 = 1;
var y1 = 10;

function getX()
{
	var timer = Math.random()*5000 + 5000;
	console.log(timer);
	return new Promise( function(resolve,reject){
		setTimeout(function(){resolve(x1++)},timer);
	});
}

function getY()
{
	var timer = Math.random()*5000+5000;
	console.log(timer);
	return new Promise( function(resolve,reject){
		setTimeout(function(){resolve(y1++)},timer);
	});
}
