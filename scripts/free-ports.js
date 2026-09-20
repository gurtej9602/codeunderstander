/**
 * scripts/free-ports.js
 * 
 * Automatically frees ports 5000 and 3000 before starting the servers
 * to prevent 'EADDRINUSE: address already in use' errors.
 */

const { execSync } = require('child_process');

const PORTS = [5000, 3000];

function freePort(port) {
  try {
    if (process.platform === 'win32') {
      const stdout = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
      const lines = stdout.split('\n');
      const pids = new Set();
      
      for (const line of lines) {
        if (line.includes('LISTENING') || line.includes(`:${port}`)) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && pid !== '0' && !isNaN(pid) && pid !== String(process.pid)) {
            pids.add(pid);
          }
        }
      }

      for (const pid of pids) {
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
          console.log(`[Auto-Clean] Cleared lingering process on port ${port} (PID ${pid})`);
        } catch (_) {}
      }
    } else {
      execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: 'ignore' });
    }
  } catch (_) {
    // Port was already free, nothing to do
  }
}

for (const port of PORTS) {
  freePort(port);
}
