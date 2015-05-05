function *main(){
	try {
		var x = yield 'Hello World';
		console.log('value of x: ' + x);
	}
	catch (err){
		console.error('Error is caught in main: ' + err);
	}
	console.log('got to end');

}

var it = main();

it.next();

try {
	it.throw('oops');
}
catch (err)
{
	console.error('Is this oops?' + err);
}

