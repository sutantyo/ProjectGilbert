
var x = 1;

function *foo(){
	console.log('start');
	x++;
	yield 2;
	console.log('x: ', x);
	yield 5;
}

var it = foo();

console.log(it.next().value);
getX().then(function(){console.log(it.next().value)});




function getX()
{
	return new Promise(function(resolve,reject){
		setTimeout(function(){resolve('hello')},5000);
	});
}

