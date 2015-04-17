# node-liner

[![Build Status](https://secure.travis-ci.org/mvolkmann/node-liner.png)](http://travis-ci.org/mvolkmann/node-liner)

This is a simple Node.js module that reads lines from files and streams.
There are other similar modules, but I believe they are
more complicated than they need to be.

## Example

    var Liner = require('liner');
    var liner = new Liner('./story.txt');

    // For Node 0.8 and before ...
    liner.on('data', function (line) {
      // Do something with line.
      console.log(line);
    });

    // For Node 0.10 and after ...
    liner.on('readable', function () {
      while (true) {
        var line = liner.read();
        if (line === null) break;
        // Do something with line.
        console.log(line);
      }
    });

    liner.on('error', function (err) {
      console.error(err);
    });

    liner.on('end', function () {
      process.exit(0);
    });
