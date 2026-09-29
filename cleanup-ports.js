const { execSync } = require('child_process');

try {
  const ports = [5000, 5001, 5002, 5003, 5004, 5005];
  ports.forEach(port => {
    try {
      const pid = execSync(`lsof -t -i:${port}`).toString().trim();
      if (pid) {
        pid.split('\n').forEach(p => {
          try {
            process.kill(parseInt(p, 10), 'SIGKILL');
            console.log(`Killed PID ${p} on port ${port}`);
          } catch (e) {}
        });
      }
    } catch (e) {}
  });
  console.log('Ports 5000-5005 cleaned successfully.');
} catch (err) {
  console.error('Cleanup error:', err.message);
}
