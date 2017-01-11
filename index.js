/* jshint node: true */
'use strict';

var exec = require('child_process').exec;
var util = require('util');
var p    = require('path');

var singleSlash = /\//g;
/*
 * NT_STATUS_NO_SUCH_FILE - when trying to dir a file in a directory that *does* exist
 * NT_STATUS_OBJECT_NAME_NOT_FOUND - when trying to dir a file in a directory that *does not* exist
 */
var missingFileRegex = /(NT_STATUS_OBJECT_NAME_NOT_FOUND|NT_STATUS_NO_SUCH_FILE)/im;

function SambaClient(options) {
  this.address  = options.address;
  this.domain = options.domain ? wrap(options.domain) : undefined;
  this.username = wrap(options.username || 'guest');
  this.password = options.password ? wrap(options.password) : undefined;
  this.domain = options.domain;
}

SambaClient.prototype.getFile = function(path, destination, cb) {
  this.runCommand('get', path, destination, cb);
};

SambaClient.prototype.sendFile = function(path, destination, cb) {
  this.runCommand('put', path, destination.replace(singleSlash, '\\'), cb);
};

SambaClient.prototype.deleteFile = function(fileName, cb) {
  this.execute('del', fileName, '', cb);
};

SambaClient.prototype.listFiles = function(fileNamePrefix, fileNameSuffix, cb) {
  var cmdArgs      = util.format('%s*%s', fileNamePrefix, fileNameSuffix);
  this.execute('dir', cmdArgs, '', function(err, allOutput) {
    var fileList = [];

    if (err && allOutput.match(missingFileRegex)) {
      return cb(null, []);
    } else if (err) {
      return cb(err, allOutput);
    }
    var lines = allOutput.split('\n');
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].toString().trim();
      if (line.startsWith(fileNamePrefix)) {
        var parsed = line.substring(0, line.indexOf(fileNameSuffix) + fileNameSuffix.length);
        fileList.push(parsed);
      }
    }
    cb(null, fileList);
	});
};

SambaClient.prototype.mkdir = function(remotePath, cb) {
  this.execute('mkdir', remotePath.replace(singleSlash, '\\'), __dirname, cb);
};

SambaClient.prototype.dir = function(remotePath, cb) {
  this.execute('dir', remotePath.replace(singleSlash, '\\'), __dirname, cb);
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

  if (this.domain) {
    args.push('-W', this.domain);
  }

  if (!this.password) {
    args.push('-N');
  }

  args.push('-c', fullCmd, this.address);

  if (this.password) {
    args.push(this.password);
  }

  if (this.domain) {
    args.push('-W');
    args.push(this.domain);
  }

  return args;
};

SambaClient.prototype.execute = function(cmd, cmdArgs, workingDir, cb) {
  var fullCmd = wrap(util.format('%s %s', cmd, cmdArgs));

  var command = ['smbclient', this.getSmbClientArgs(fullCmd).join(' ')].join(' ');

  var options = {
    cwd : workingDir
  };

  exec(command, options, function(err, stdout, stderr) {
    var allOutput = (stdout + stderr);
    if(err !== null) {
      err.message += allOutput;
    }
    cb(err, allOutput);
  });
};

SambaClient.prototype.runCommand = function(cmd, path, destination, cb) {
  var workingDir   = p.dirname(path);
  var fileName     = p.basename(path).replace(singleSlash, '\\');
  var cmdArgs      = util.format('%s %s', fileName, destination);

  this.execute(cmd, cmdArgs, workingDir, cb);
};

module.exports = SambaClient;

function wrap(str) {
  return '"' + str + '"';
}
