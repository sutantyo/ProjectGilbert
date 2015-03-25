var fs = require('fs');
var pg = require('pg');
var copyFrom = require('pg-copy-streams').from;
var async = require('async');

var connectionString = 'postgres://daniels:macquarie@localhost/crawdad';

var table_name = 'taxi_roma';
var input_filename = 'taxi_february_full.csv';


pg.connect(connectionString, function(err,client,done){
	if(err) {
    return console.error('could not connect to postgres', err);
  }
	
	async.series([
		function(callback){
			client.query('DROP TABLE IF EXISTS ' + table_name, function(err,result){
				if (err)
					return console.error('could not drop table', err);
				done();
				callback(null,'one');
			});
		},
		function(callback){
			client.query('CREATE TABLE IF NOT EXISTS ' + table_name + ' (id smallint, date date, time time, x decimal, y	decimal)', 
				function(err,result){
					if (err)
						return console.error('could not create table', err);
					done();
					callback(null,'two');
				});
		},
		function(callback){
			var stream = client.query(copyFrom('COPY ' + table_name + ' FROM STDIN WITH CSV'),function(err,data){
				
				if(err)
					return console.error('error sending copyFrom query',err);
			});
			//var stream = fs.createWriteStream('output.txt');
			var fileStream = fs.createReadStream(input_filename, function(err,data){
				if (err) 
					return console.error('error opening input file', err);
			});
			fileStream.on('error',function(err){
				console.log('Stream error', err);	
				done;
			});
			fileStream.pipe(stream)
				.on('finish',function(err){
					if (err) return console.log('Pipe error (cannot finish?): ', err);
					done;
					callback(null,'three');
				})
				.on('error',function(err){
					if (err) return console.log('Pipe error: ', err);
					done;
				});
		}
	],
	function(err,results){
		if(err){
			return console.error("copyFrom failed", err);
		}
		console.log("copyFrom finished: " + results);
		client.end();
	})//end async
});
