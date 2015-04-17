'use strict';
var Liner = require('../index.js');
var stream = require('stream');
var hasStreams2 = stream.Readable !== undefined;

function compareLines(t, lines) {
  var len = lines.length;
  t.equal(len, 25, 'number of lines read');
  t.equal(lines[0],
    'Come and listen to a story about a man named Jed',
    'first line');
  t.equal(lines[len - 1], "Y'all come back now, y'hear?.",
    'last line');
  t.done();
}

function testIt(t) {
  var lines = [], liner;
  liner = new Liner('../story.txt');

  if (hasStreams2) {
    liner.on('readable', function () {
      while (true) {
        var line = liner.read();
        if (line === null) break;
        lines.push(line);
      }
    });
  } else {
    liner.on('data', function (line) {
      lines.push(line);
    });
  }

  liner.on('error', t.ifError);
  liner.on('end', compareLines.bind(null, t, lines));
}

exports.testIt = testIt;
