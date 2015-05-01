var p3 = new Promise( function(resolve,reject){
    resolve( "B" );
} );

var p1 = new Promise( function(resolve,reject){
    resolve( p3 );
} );

var p2 = new Promise( function(resolve,reject){
    resolve( "A" );
} );

p1.then( function(v){
    console.log( v );
} );

p2.then( function(v){
    console.log( v );
} );


var p10 = Promise.resolve(21);
var p11 = p10.then(function(v){
											console.log(v);
											return v*2;
					});

p11.then(function(v){
	console.log(v);
});

p10.then(function(v){console.log(v);return v*2;}).then(function(v){console.log(v);});
p10.then(function(v){console.log(50)}).then(console.log(100));


