node-samba-client
=================

Node.js wrapper for smbclient

	var SambaClient = require('samba-client');

	var client = new SambaClient({
	  address: '//server/folder', // required
	  username: 'test', // not required, defaults to guest
	  password: 'test', // not required
	});

	// send a file
	client.sendFile('somePath/file', 'destinationFolder/name', function(err) {});

	// get a file
	client.getFile('someRemotePath/file', 'destinationFolder/name', function(err) {})
