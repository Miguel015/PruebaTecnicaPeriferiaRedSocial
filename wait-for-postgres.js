const net = require('net');

const host = process.env.DB_HOST || 'postgres';
const port = parseInt(process.env.DB_PORT || '5432', 10);

function waitFor() {
  return new Promise((resolve) => {
    const tryConnect = () => {
      const sock = new net.Socket();
      sock.setTimeout(2000);
      sock.on('connect', () => {
        sock.destroy();
        resolve();
      });
      sock.on('error', () => {
        sock.destroy();
        setTimeout(tryConnect, 1000);
      });
      sock.on('timeout', () => {
        sock.destroy();
        setTimeout(tryConnect, 1000);
      });
      sock.connect(port, host);
    };
    tryConnect();
  });
}

console.log(`Waiting for Postgres at ${host}:${port}...`);
waitFor().then(() => {
  console.log('Postgres is available');
  process.exit(0);
});
