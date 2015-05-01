var something = (function(){
	var nextVal;

	return {
			//[Symbol.iterator]: function(){ return this; },

			next: function(){
				if (nextVal === undefined){
					nextVal = 1;
				}
				else{
					nextVal = (3*nextVal) + 1;
				}

				return { done: false, value: nextVal};
			}
	};
})();

function foo(){
	var time = Math.trunc(Math.random()*1000) + 1000;
	console.log(time);
	setTimeout(function(){
		if (time % 2 === 1)
			it.next('received data from db');
		else
			it.throw('failed to received data');
	},time);
}

function *main(){
	try {
		var text = yield foo();
		console.log(text);
	}
	catch (err){
		console.error(err);
	}
	console.log('got to end');
}

var it = main();
it.next();
var it2 = main();
it2.next();
