'use strict';

const exec = require('child_process').exec;
const util = require('util');
const p    = require('path');

const singleSlash = /\//g;
/*
 * NT_STATUS_NO_SUCH_FILE - when trying to dir a file in a directory that *does* exist
 * NT_STATUS_OBJECT_NAME_NOT_FOUND - when trying to dir a file in a directory that *does not* exist
 */
const missingFileRegex = /(NT_STATUS_OBJECT_NAME_NOT_FOUND|NT_STATUS_NO_SUCH_FILE)/im;

function wrap(str) {
  return '\'' + str + '\'';
}

class SambaClient {
  constructor(options) {
    this.address = options.address;
    this.username = wrap(options.username || 'guest');
    this.password = options.password ? wrap(options.password) : null;
    this.domain = options.domain;
  }

  getFile(path, destination, cb) {
    this.runCommand('get', path, destination, cb);
  }

  sendFile(path, destination, cb) {
    this.runCommand('put', path, destination.replace(singleSlash, '\\'), cb);
  }

  deleteFile(fileName, cb) {
    this.execute('del', fileName, '', cb);
  }

  listFiles(fileNamePrefix, fileNameSuffix, cb) {
    let cmdArgs = util.format('%s*%s', fileNamePrefix, fileNameSuffix);
    this.execute('dir', cmdArgs, '', function(err, allOutput) {
      let fileList = [];

      if (err && allOutput.match(missingFileRegex)) {
        return cb(null, []);
      } else if (err) {
        return cb(err, allOutput);
      }

      let lines = allOutput.split('\n');
      for (let i = 0; i < lines.length; i++) {
        let line = lines[i].toString().trim();
        if (line.startsWith(fileNamePrefix)) {
          let parsed = line.substring(0, line.indexOf(fileNameSuffix) + fileNameSuffix.length);
          fileList.push(parsed);
        }
      }
      cb(null, fileList);
    });
  }

  mkdir(remotePath, cb) {
    this.execute('mkdir', remotePath.replace(singleSlash, '\\'), __dirname, cb);
  }

  dir(remotePath, cb) {
    this.execute('dir', remotePath.replace(singleSlash, '\\'), __dirname, cb);
  }

  fileExists(remotePath, cb) {
    this.dir(remotePath, function(err, allOutput) {

      if (err && allOutput.match(missingFileRegex)) {
        return cb(null, false);
      } else if (err) {
        return cb(err, allOutput);
      }
      cb(null, true);
    });
  }

  getSmbClientArgs(fullCmd) {
    let args = ['-U', this.username];

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
  }

  execute(cmd, cmdArgs, workingDir, cb) {
    let fullCmd = wrap(util.format('%s %s', cmd, cmdArgs));

    let command = ['smbclient', this.getSmbClientArgs(fullCmd).join(' ')].join(' ');

    let options = {
      cwd : workingDir
    };

    exec(command, options, function(err, stdout, stderr) {
      let allOutput = (stdout + stderr);
      if(err !== null) {
        err.message += allOutput;
      }
      cb(err, allOutput);
    });
  }

  runCommand(cmd, path, destination, cb) {
    let workingDir   = p.dirname(path);
    let fileName     = p.basename(path).replace(singleSlash, '\\');
    let cmdArgs      = util.format('%s %s', fileName, destination);

    this.execute(cmd, cmdArgs, workingDir, cb);
  }

  getAllShares(cb) {
    exec('smbtree -U guest -N', {}, function(err, stdout, stderr) {
      let allOutput = (stdout + stderr);
      if (err !== null) {
        err.message += allOutput;
        cb(err, null);
        return;
      }

      let shares = [];
      for (let line in stdout.split(/\r?\n/)) {
        let words = line.split(/\t/);
        if (words.length > 2 && words[2].match(/^\s*$/) !== null) {
          shares.append(words[2].trim());
        }
      }

      cb(null, shares);
    });
  }
}

module.exports = SambaClient;
