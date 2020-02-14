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

  getFile(path, destination) {
    return this.runCommand('get', path, destination);
  }

  sendFile(path, destination) {
    return this.runCommand('put', path, destination.replace(singleSlash, '\\'));
  }

  deleteFile(fileName) {
    return this.execute('del', fileName, '');
  }

  async listFiles(fileNamePrefix, fileNameSuffix) {
    try {
      let cmdArgs = util.format('%s*%s', fileNamePrefix, fileNameSuffix);
      let allOutput = await this.execute('dir', cmdArgs, '');
      let fileList = [];
      let lines = allOutput.split('\n');
      for (let i = 0; i < lines.length; i++) {
        let line = lines[i].toString().trim();
        if (line.startsWith(fileNamePrefix)) {
          let parsed = line.substring(0, line.indexOf(fileNameSuffix) + fileNameSuffix.length);
          fileList.push(parsed);
        }
      }
      return fileList;
    } catch(e) {
      if (e.message.match(missingFileRegex)) {
        return [];
      } else {
        throw e;
      }
    }
  }

  mkdir(remotePath, cwd) {
    return this.execute('mkdir', remotePath.replace(singleSlash, '\\'), cwd !== null && cwd !== undefined ? cwd : __dirname);
  }

  dir(remotePath, cwd) {
    return this.execute('dir', remotePath.replace(singleSlash, '\\'), cwd !== null && cwd !== undefined ? cwd : __dirname);
  }

  async fileExists(remotePath) {
    try {
      await this.dir(remotePath);
      return true;
    } catch(e) {
      if (e.message.match(missingFileRegex)) {
        return false;
      } else {
        throw e;
      }
    }
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

  execute(cmd, cmdArgs, workingDir) {
    let fullCmd = wrap(util.format('%s %s', cmd, cmdArgs));
    let command = ['smbclient', this.getSmbClientArgs(fullCmd).join(' ')].join(' ');

    let options = {
      cwd: workingDir
    };

    return new Promise((resolve, reject) => {
      exec(command, options, function(err, stdout, stderr) {
        let allOutput = stdout + stderr;

        if (err) {
          err.message += allOutput;
          return reject(err);
        }

        return resolve(allOutput);
      });
    });
  }

  runCommand(cmd, path, destination) {
    let workingDir = p.dirname(path);
    let fileName = p.basename(path).replace(singleSlash, '\\');
    let cmdArgs = util.format('%s %s', fileName, destination);

    return this.execute(cmd, cmdArgs, workingDir);
  }

  getAllShares() {
    return new Promise((resolve, reject) => {
      exec('smbtree -U guest -N', {}, function(err, stdout, stderr) {
        let allOutput = stdout + stderr;

        if (err !== null) {
          err.message += allOutput;
          return reject(err);
        }

        let shares = [];
        for (let line in stdout.split(/\r?\n/)) {
          let words = line.split(/\t/);
          if (words.length > 2 && words[2].match(/^\s*$/) !== null) {
            shares.append(words[2].trim());
          }
        }

        return resolve(shares);
      });
    });
  }
}

module.exports = SambaClient;
