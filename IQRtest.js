
var A = [];

for (var i = 1; i <= 20; i++)
{
	var B = [];
	for (var j = 1; j <= i; j++)	
	{
		B.push(j);
	}
	A.push(B);
}


for (var i = 0; i <= 19; i++)
{
	var c = find_median(A[i],false);
	console.log(A[i]);
	console.log(c.pctl25 + ' ' + c.pctl50 + ' ' + c.pctl75);
	console.log(A[i]);
}

function find_median(array,stop)
{
	var pctl25, pctl50, pctl75, n;

	if (array.length === 1)
		return {pctl25: array[0], pctl50: array[0], pctl75: array[0]};

	if (array.length % 2 === 0)
	{
		n = (array.length-2)/2;
		pctl50 = (array[n] + array[n+1])/2;
		if (!stop)
		{
		  pctl25 = find_median(array.slice(0,n+1),true);
		  pctl75 = find_median(array.slice(n+1,array.length),true);
			return {pctl25: pctl25, pctl50: pctl50, pctl75: pctl75};
		}
		else
			return pctl50;
	}
	else
	{
		n = (array.length-1)/2;
		pctl50 = (array[n]);
		if (!stop)
		{
		  pctl25 = find_median(array.slice(0,n),true);
		  pctl75 = find_median(array.slice(n+1,array.length),true);
			return {pctl25: pctl25, pctl50: pctl50, pctl75: pctl75};
		}
		else
			return pctl50;
	}
}



