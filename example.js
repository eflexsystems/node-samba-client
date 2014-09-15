'use strict';

var fs          = require('fs');
var SambaClient = require('./');

var testFile = 'test.txt';

fs.writeFileSync(testFile, testFile);

var client = new SambaClient({
  address: process.argv[2],
  username: 'Guest'
});

client.sendFile(testFile, testFile, function(err) {
  if (err) {
    return console.error(err);
  }

  console.log('sent test file to samba share at ' + client.address);

  fs.unlinkSync(testFile);

  client.getFile(testFile, testFile, function(err) {
    if (err) {
      return console.error(err);
    }

    console.log('got test file from samba share at ' + client.address);
  });
});

process.on('exit', function() {
  fs.unlinkSync(testFile);
});
