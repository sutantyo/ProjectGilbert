function getValue(){
	return new Promise( function(resolve,reject){
		setTimeout(function(){resolve(5);},2000)
	});
}

getValue().then(function(x){console.log(x)});

var p = getValue();

foo(p);
bar(p);

function foo(aPromise){
	aPromise.then(
		function(x){console.log(x)}
		);
};

function bar(aPromise){
	aPromise.then(
		function(x){console.log(x)}
		);
};

var p1 = Promise.resolve(21);

p1.then(function(v){
	console.log('Wrong: ' + v);
	setTimeout(function(){return v*2},3000);
}).then(function(v){
	console.log('Wrong: ' + v);
});

p1.then(function(v){
	console.log('Correct: ' + v);
	return new Promise( function(resolve,reject){
		resolve(v*2);
	});
}).then(function(v){
	console.log('Correct: ' + v);
});
