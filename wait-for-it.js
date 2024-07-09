const net = require('net');
const { exec } = require('child_process');
const args = process.argv.slice(2);
const host = args[0];
const port = parseInt(args[1], 10);

const waitForIt = (host, port, timeout = 10000) => new Promise((resolve, reject) => {
  if (isNaN(port) || port < 0 || port >= 65536) {
    reject(new Error(`Invalid port number: ${port}`));
    return;
  }

  const timer = setTimeout(() => {
    reject(new Error('Timeout waiting for database'));
    client.end();
  }, timeout);

  const client = new net.Socket();

  const tryConnect = () => {
    client.connect({ host, port }, () => {
      clearTimeout(timer);
      client.end();
      resolve();
    });
  };

  client.on('error', (err) => {
    console.log('Waiting for database...');
    setTimeout(tryConnect, 1000);
  });

  tryConnect();
});

waitForIt(host, port)
  .then(() => {
    console.log('Database is ready!');
    // Run the remaining command
    const remainingArgs = args.slice(2).join(' ');
    exec(remainingArgs, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        process.exit(1);
      }
      console.log(`stdout: ${stdout}`);
      console.error(`stderr: ${stderr}`);
    });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
