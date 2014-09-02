'use strict';

var execFile = require('child_process').execFile;
var util     = require('util');
var p        = require('path');

function SambaClient(options) {
  this.address  = options.address;
  this.username = options.username || 'guest';
  this.password = options.password;
}

SambaClient.prototype.getFile = function(path, destination, cb) {
  this.runCommand('get', path, destination, cb);
};

SambaClient.prototype.sendFile = function(path, destination, cb) {
  this.runCommand('put', path, destination.replace('/', '\\'), cb);
};

SambaClient.prototype.runCommand = function(cmd, path, destination, cb) {
  var passwordFlag = this.password ? this.password : '-N';
  var workingDir   = p.dirname(path);
  var fileName     = p.basename(path).replace('/', '\\');
  var fullCmd      = util.format('%s %s %s', cmd, fileName, destination);

  var args = ['-U', this.username, passwordFlag, '-c', fullCmd, this.address];

  var options = {
    cwd: workingDir
  };

  execFile('smbclient', args, options, function(err, stdout, stderr) {
    var allOutput = (stdout + stderr).toLowerCase();
    cb(err, allOutput);
  });
};

module.exports = SambaClient;
