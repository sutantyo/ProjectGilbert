'use strict';
var Liner = require('index.js');

var liner = new Liner('story.txt');
liner.on('data', function (line) {
  console.log(line);
});
liner.on('err', function (err) {
  console.error(err);
});
liner.on('end', function () {
  process.exit(0);
});
