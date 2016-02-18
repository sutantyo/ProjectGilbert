var express = require('express');
var app = express();
var pg = require('pg');

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  response.render('pages/index')
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

app.get('/data', function(req,res){
	pg.connect(process.env.DATABASE_URL,function(err,client,done){
		client.query("SELECT * FROM soldier", function(err,result){
			done();
			if (err){
				res.status(500).send('Error running query');
			}
			var json_response = JSON.stringify(result.rows);
			res.writeHead(200,{'content-type':'application/json','content-length':Buffer.byteLength(json_response)});
			res.end(json_response);
			client.end();
		});
	});
});

app.get('/data/:query', function(req,res){
	pg.connect(process.env.DATABASE_URL,function(err,client,done){
		client.query(req.params.query, function(err,result){
			done();
			if (err){
				res.status(500).send('Error running query');
			}
			var json_response = JSON.stringify(result.rows);
			res.writeHead(200,{'content-type':'application/json','content-length':Buffer.byteLength(json_response)});
			res.end(json_response);
			client.end();
		});
	});
});
