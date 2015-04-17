'use strict';
var fs = require('fs');
var os = require('os');
var stream = require('stream');
var util = require('util');

var hasStreams2 = stream.Readable !== undefined;
var superclass = hasStreams2 ? stream.Transform : stream;

/**
 * Constructs a Liner object.
 * To use with streams2, listen for "readable" events and
 * call the read method as long is it doesn't return null.
 * To use with old-style streams, listen for "data" events.
 * @param source a string file path or a stream
 * @param bufferSize optional; used when source is a file path; defaults to 512
 */
function Liner(source, bufferSize) {
  var rs, that = this;

  // Using objectMode allows empty strings to pushed for blank lines.
  superclass.call(this, {encoding: 'utf8', objectMode: true});

  rs = typeof source === 'string' ?
    fs.createReadStream(source, {bufferSize: bufferSize || 512}) :
    source;
  rs.on('error', function (err) {
    that.emit('error', err);
  });

  if (hasStreams2) {
    this.leftover = '';
    rs.pipe(this);
  } else {
    handleOldStyleStreams(this, rs);
  }
}
util.inherits(Liner, superclass);

if (hasStreams2) { // use new-style streams
  Liner.prototype._transform = function (chunk, encoding, cb) {
    var lines, that = this;

    lines = chunk.toString().split(os.EOL);
    this.leftover = lines.pop();

    lines.forEach(function (line) {
      that.push(line);
    });

    cb();
  };
}

function handleOldStyleStreams(liner, rs) {
  var leftover = '';

  rs.on('data', function (buffer) {
    var lines = buffer.toString().split(os.EOL);
    lines[0] = leftover + lines[0];
    leftover = lines.pop();
    lines.forEach(function (line) {
      liner.emit('data', line);
    });
  });

  rs.on('end', function () {
    if (leftover.length > 0) {
      liner.emit('data', leftover);
    }
  });

  rs.on('error', function (err) {
    liner.emit('error', err);
  });

  rs.on('close', function () {
    liner.emit('end');
  });
}

module.exports = Liner;
