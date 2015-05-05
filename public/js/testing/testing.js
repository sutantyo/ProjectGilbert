var now = require('performance-now')

var max_sim = 1000;
var max_number = 10;

var values = [];
var inputs = [];
for(var i = 0; i < max_sim; i++)
{
	values[i] = Math.floor(Math.random() * max_number);
	inputs[i] = Math.floor(Math.random() * max_number);
	//values[i] = Math.floor(Math.random() * max_number);
	//inputs[i] = Math.floor(Math.random() * max_number);
}

var start;
var end;

start = now();
var pushArray = [];
for (var i = 0; i < max_sim; i++)
{
	pushArray.push(values[i]);
}
end = now();
console.log('Using push to populate array: ' + (end - start));


start = now();
var lookupArray = [];
for (var i = 0; i < max_sim; i++)
{
	lookupArray[(values[i])] = 1;
}
end = now();
console.log('Using lookup array: ' + (end - start));

/*
console.log(inputs);
console.log(values);
console.log(pushArray);
console.log(lookupArray);
*/

var count1 = 0;
start = now();
for (var i = 0; i < max_sim; i++)
{
	if (pushArray.indexOf(inputs[i]) != -1)
	{count1++}
}
end = now();
console.log('Push array mark: ' + (end - start));
console.log(count1);

var count2 = 0;
start = now();
for (var i = 0; i < max_sim; i++)
{
	if (lookupArray[inputs[i]] === 1)
	{count2++}
}
end = now();
console.log('Lookup array mark: ' + (end - start));
console.log(count2);
