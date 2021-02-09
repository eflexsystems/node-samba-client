"use strict";

const fs = require("fs").promises;
const SambaClient = require("./");

const testFile = "test.txt";

const client = new SambaClient({
  address: process.argv[2],
});

async function run() {
  await fs.writeFile(testFile, testFile);

  const list = await client.listFiles("eflex", ".txt");
  console.log(`found these files: ${list}`);

  await client.mkdir("test directory");
  console.log(`created test directory on samba share at ${client.address}`);

  await client.sendFile(testFile, testFile);
  console.log(`sent test file to samba share at ${client.address}`);

  await fs.unlink(testFile);

  await client.getFile(testFile, testFile);
  console.log(`got test file from samba share at ${client.address}`);

  const exists = await client.fileExists(testFile);
  if (exists) {
    console.log(`test file exists on samba share at ${client.address}`);
  } else {
    console.log(`test file does not exist on samba share at ${client.address}`);
  }

  await fs.unlink(testFile);
}

run();
