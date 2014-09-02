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
    // Samba is crazy and writes to standard error when the command is successful
    var allOutput = (stdout + stderr).toLowerCase();

    if (err) {
      cb(err);
    } else if (allOutput.indexOf('error') > -1 || allOutput.indexOf('fail') > -1 || allOutput.indexOf('not enough') > -1) {
      cb(new Error('Samba Error - ' + allOutput));
    } else {
      cb(null, allOutput);
    }
  });
};

module.exports = SambaClient;
