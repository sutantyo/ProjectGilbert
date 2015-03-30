var express = require('express');
var morgan = require('morgan');
var url = require('url');
var bodyParser = require('body-parser');
var pg = require('pg');

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.set('port',(process.env.PORT || 5000));

// this is used to serve files in public directory
app.use(express.static(__dirname + '/public'));

app.use(morgan('dev'));
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

// Database matters:

// Local database
//var connectionString = 'postgres://daniels:macquarie@localhost/crawdad';
var connectionString = process.env.DATABASE_URL;

app.get(['/','/home'], function(req,res){
	res.render('taxi_roma',
		{ title : 'Project Gilbert' }
	);
});

app.get('/scripts', function(req,res){
	res.redirect('/scripts');
});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'));
});

app.get('/taxi_roma/all', function(req,res){
	console.log('calling to get all taxi id');
	pg.connect(connectionString, function(err,client,done){
		if(err)
			return console.error('error fetching client from pool',err);
		client.query("SELECT DISTINCT id FROM taxi_roma", function(err,result){
			if (err){
				return console.error('error running query',err);
				res.status(500).send('Error running query');
			}
			var json_response = JSON.stringify(result.rows);
			res.writeHead(200,{'content-type':'application/json','content-length':Buffer.byteLength(json_response)});
			res.end(json_response);
			client.end();
		});
	});
});

app.get('/maptest', function(req,res){
	res.render('maptest');
});

// GET data according to time
app.get('/taxi_roma/time', function(req,res){
	var startTime;
	var endTime;
	if (req.query.start && req.query.end)
	{
		start_hour = req.query.start.substr(0,2);
		start_min  = req.query.start.substr(3,2);
		start_sec  = req.query.start.substr(6,2);
		startTime = new Date(2000,1,1,req.query.start.substr(0,2),
																		  req.query.start.substr(3,2),
																		  req.query.start.substr(6,2),0);
		startTime = startTime.toTimeString().substr(0,8);
		endTime   = new Date(2000,1,1,req.query.end.substr(0,2),
																		  req.query.end.substr(3,2),
																		  req.query.end.substr(6,2),0);
		endTime = endTime.toTimeString().substr(0,8);
	}
	else
		res.status(400).send("Incorrect GET parameters");

	console.log('calling to get coordinates');
	pg.connect(connectionString, function(err,client,done){
		if(err)
			return console.error('error fetching client from pool', err);
		client.query("SELECT id, x, y FROM taxi_roma WHERE time >= '" + startTime + "' AND time < '" + endTime +"'", function (err,result){
			done();
			if (err){
				return console.error('error running query',err);
				res.status(500).send('Error running query');
			}
			var json_response = JSON.stringify(result.rows);
			res.writeHead(200,{'content-type':'application/json','content-length':Buffer.byteLength(json_response)});
			res.end(json_response);
			client.end();
		});
	});
});

