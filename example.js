'use strict';

var fs          = require('fs');
var SambaClient = require('./');

var testFile = 'test.txt';

fs.writeFileSync(testFile, testFile);

var client = new SambaClient({
  address: process.argv[2],
  username: 'Guest'
});

client.mkdir('test-directory', function(err) {
  if (err) {
    return console.error(err);
  }

  console.log('created test directory on samba share at ' + client.address);
});


client.listFiles('eflex', '.txt', function(err, list) {
  if (err) {
    return console.error(err);
  }

  console.log('found these files: ' + list);
});

client.mkdir('test-directory', function(err) {if (err) {return console.error(err);}console.log('created test directory on samba share at ' + client.address);});

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

  client.fileExists(testFile, function(err, exists) {
    if (err) {
      return console.error(err);
    }

    if (exists) {
      console.log('test file exists on samba share at ' + client.address);
    } else {
      console.log('test file does not exist on samba share at ' + client.address);
    }
  });
});

process.on('exit', function() {
  fs.unlinkSync(testFile);
});
