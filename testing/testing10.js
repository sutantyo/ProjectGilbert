function run(gen){
	var args = [].slice.call(arguments,1), it;

	it = gen.apply(this, args);

	return Promise.resolve()
		.then(
			function handleNext(value){
				var next = it.next(value);
				console.log('value is: ' + value + a);
				console.log(next);
				return (function handleResult(next){
					if (next.done){
						return next.value;
					}
					else
					{
						return Promise.resolve(next.value)
							.then(handleNext,function handleErr(err){
																	return Promise.resolve(it.throw(err)).then(handleResult);
							});
					}
				})(next);
			} // end function handleNext
			); // end of then
}

function *foo3(){
	var r1 = yield getX();
	var r2 = yield getY();

	var r3 = yield getX(r1,r2);

	console.log(r3);
};



function *main() {
		try {
			var text = yield foo2();
			console.log(text);
		}
		catch (err){
			console.error(err);
		}
}

function foo(){
	var time = Math.trunc(Math.random()*1000) + 1000;
	console.log(time);
	setTimeout(function(){
		if (time)
			it.next('received data from db');
		else
			it.throw('failed to received data');
	},time);
}

function *foo2(){
	var results = yield Promise.all([getX(),getY()]);

	var r1 = results[0];
	var r2 = results[1];

	console.log(r1 + ' and ' + r2);
}


var it = foo2();
var test = it.next().value;


var x1 = 1;
var y1 = 11;
function getX()
{
	var timer = Math.random()*1000 + 2000;
	console.log(timer);
	return new Promise( function(resolve,reject){
		setTimeout(function(){resolve(x1++)},timer);
	});
}

function getY()
{
	var timer = Math.random()*1000+2200;
	console.log(timer);
	return new Promise( function(resolve,reject){
		setTimeout(function(){resolve(y1++)},timer);
	});
}


run(foo3);
