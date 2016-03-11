'use strict';

var execFile = require('child_process').execFile;
var util     = require('util');
var p        = require('path');

/*
 * NT_STATUS_NO_SUCH_FILE - when trying to dir a file in a directory that *does* exist
 * NT_STATUS_OBJECT_NAME_NOT_FOUND - when trying to dir a file in a directory that *does not* exist
 */
var missingFileRegex = /(NT_STATUS_OBJECT_NAME_NOT_FOUND|NT_STATUS_NO_SUCH_FILE)/im;

function SambaClient(options) {
  this.address  = options.address;
  this.username = wrap(options.username || 'guest');
  this.password = wrap(options.password);
}

SambaClient.prototype.getFile = function(path, destination, cb) {
  this.runCommand('get', path, destination, cb);
};

SambaClient.prototype.sendFile = function(path, destination, cb) {
  this.runCommand('put', path, destination.replace('/', '\\'), cb);
};

SambaClient.prototype.mkdir = function(remotePath, cb) {
  this.execute('mkdir', remotePath.replace('/', '\\'), __dirname, cb);
};

SambaClient.prototype.dir = function(remotePath, cb) {
  this.execute('dir', remotePath.replace('/', '\\'), __dirname, cb);
};

SambaClient.prototype.fileExists = function(remotePath, cb) {
  this.dir(remotePath, function(err, allOutput) {

    if (err && allOutput.match(missingFileRegex)) {
      return cb(null, false);
    } else if (err) {
      return cb(err, allOutput);
    }

    cb(null, true);
  });
};

SambaClient.prototype.getSmbClientArgs = function(fullCmd) {
  var args = ['-U', this.username];

  if (!this.password) {
    args.push('-N');
  }

  args.push('-c', fullCmd, this.address);

  if (this.password) {
    args.push(this.password);
  }

  return args;
};

SambaClient.prototype.execute = function(cmd, cmdArgs, workingDir, cb) {
  var fullCmd = wrap(util.format('%s %s', cmd, cmdArgs));

  var args = this.getSmbClientArgs(fullCmd);

  var options = {
    cwd : workingDir
  };

  execFile('smbclient', args, options, function(err, stdout, stderr) {
    var allOutput = (stdout + stderr);
    cb(err, allOutput);
  });
};

SambaClient.prototype.runCommand = function(cmd, path, destination, cb) {
  var workingDir   = p.dirname(path);
  var fileName     = p.basename(path).replace('/', '\\');
  var cmdArgs      = util.format('%s %s', fileName, destination);

  this.execute(cmd, cmdArgs, workingDir, cb);
};

module.exports = SambaClient;

function wrap(str) {
  return '\'' + str + '\'';
}
