# node-samba-client

Node.js wrapper for smbclient

## Requirements

Requires Node.js 10+
Smbclient must be installed. This can be installed on Ubuntu with `sudo apt-get install smbclient`.

## API

```javascript
const SambaClient = require('samba-client');

let client = new SambaClient({
  address: '//server/folder', // required
  username: 'test', // not required, defaults to guest
  password: 'test', // not required
  domain: 'WORKGROUP', // not required
  maxProtocol: 'SMB3', // not required
  maskCmd: true, // not required, defaults to false
});

// send a file
await client.sendFile('somePath/file', 'destinationFolder/name');

// get a file
await client.getFile('someRemotePath/file', 'destinationFolder/name');

// create a folder
await client.mkdir('folder/tree', (optional) 'current/working/directory');
// By default CWD is __dirname

// executes dir command in remote directory
await client.dir('remote/folder', (optional) 'current/working/directory');
// By default CWD is __dirname

// validate if file or folder exists in the remote device
await client.fileExists('remote/file', (optional) 'current/working/directory');
// By default CWD is __dirname
```

## Troubleshooting

### Error: spawn ENOTDIR in Electron

Pass an empty string in the Current Working Directory parameter, for more information see [this PR](https://github.com/eflexsystems/node-samba-client/pull/20).
