const { spawn } = require('child_process');
const path = require('path');

const services = [
  { name: 'API GATEWAY       [5000]', cwd: path.join(__dirname, 'backend/gateway-service'), cmd: 'node', args: ['src/index.js'] },
  { name: 'CATALOG SERVICE   [5001]', cwd: path.join(__dirname, 'backend/catalog-service'), cmd: 'node', args: ['src/index.js'] },
  { name: 'CART SERVICE      [5002]', cwd: path.join(__dirname, 'backend/cart-service'), cmd: 'node', args: ['src/index.js'] },
  { name: 'ORDER SERVICE     [5003]', cwd: path.join(__dirname, 'backend/order-service'), cmd: 'node', args: ['src/index.js'] },
  { name: 'PAYMENT LAMBDA    [5004]', cwd: path.join(__dirname, 'backend/payment-service'), cmd: 'node', args: ['src/local-server.js'] },
  { name: 'NOTIFICATION LAMBDA[5005]', cwd: path.join(__dirname, 'backend/notification-service'), cmd: 'node', args: ['src/local-server.js'] },
];

console.log('===========================================================');
console.log('🚀 STARTING AETHERCART MICROSERVICES ECOSYSTEM CLUSTER');
console.log('===========================================================');

const processes = [];

services.forEach(s => {
  const p = spawn(s.cmd, s.args, { cwd: s.cwd, stdio: 'pipe' });
  
  p.stdout.on('data', data => {
    process.stdout.write(`[${s.name}] ${data.toString()}`);
  });

  p.stderr.on('data', data => {
    process.stderr.write(`[${s.name} ERROR] ${data.toString()}`);
  });

  processes.push(p);
});

process.on('SIGINT', () => {
  console.log('\nShutting down all microservices processes...');
  processes.forEach(p => p.kill());
  process.exit();
});
