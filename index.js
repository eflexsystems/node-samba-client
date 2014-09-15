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
  var workingDir   = p.dirname(path);
  var fileName     = p.basename(path).replace('/', '\\');
  var fullCmd      = util.format('%s %s %s', cmd, fileName, destination);

  var args = ['-U', this.username];

  if (!this.password) {
    args.push('-N');
  }

  args.push('-c', fullCmd, this.address);

  if (this.password) {
    args.push(this.password);
  }

  var options = {
    cwd: workingDir
  };

  execFile('smbclient', args, options, function(err, stdout, stderr) {
    var allOutput = (stdout + stderr);
    cb(err, allOutput);
  });
};

module.exports = SambaClient;
