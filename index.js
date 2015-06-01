var express = require('express');
var morgan = require('morgan');
var url = require('url');
var bodyParser = require('body-parser');
var pg = require('pg');

var db_password = require('./private/db_password')

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
var connection_string = db_password.connection_string;

// For heroku
//var connection_string = process.env.DATABASE_URL;

app.get(['/roma'], function(req,res){
	res.render('taxi_roma',
		{ title : 'Project Gilbert' }
	);
});

app.get(['/'], function(req,res){
	res.render('taxi_sf',
		{ title : 'Project Gilbert' }
	);
});

app.get(['/sanfrancisco'], function(req,res){
	res.render('taxi_sf',
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
	pg.connect(connection_string, function(err,client,done){
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


var available_dataset = ['taxi_roma_epoch','taxi_sf_epoch'] 
app.get('/dataset/:dataset_name/time', function(req,res){

	if (available_dataset.indexOf(req.params.dataset_name) == -1)
		res.status(404).send("Dataset not available");
	else
	{
		if (req.query.start && req.query.end)
		{
			var start_time = parseInt(req.query.start);
			var end_time = parseInt(req.query.end);
			var table_name = req.params.dataset_name;
			pg.connect(connection_string, function(err,client,done){
				if(err)
					return console.error('error fetching client from pool', err);

				client.query("SELECT id, x, y, time FROM " + table_name + " WHERE time >= '" + start_time + "' AND time < '" + end_time +"'", function (err,result){
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
		}
		else
			res.status(400).send("Incorrect GET parameters");
	}
});
