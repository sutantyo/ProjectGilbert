var express = require('express');
var morgan = require('morgan');
var bodyParser = require('body-parser');

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.set('port',(process.env.PORT || 5000));

// this is used to serve files in public directory
app.use(express.static(__dirname + '/public'));

app.use(morgan('dev'));
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.get(['/','/home'], function(req,res){
	res.render('taxi_roma',
		{ title : 'Project Gilbert' }
	);
});

app.get('/scripts', function(req,res){
	res.redirect('/scripts');
});

/*
app.get('/play', function(req,res){
	res.render('d3fun1',
		{ title : 'd3 tutorial' }
	);
});

app.get('/play/:chapter', function(req,res){
	res.render('d3fun'+req.params.chapter,
		{ title : 'd3 tutorial' }
	);
});
*/

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'));
});
