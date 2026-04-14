/**
 * ─── PM2 Ecosystem Config ───
 *
 * Start in cluster mode:
 *   pm2 start ecosystem.config.js --env production
 *
 * Start in development:
 *   pm2 start ecosystem.config.js
 */

module.exports = {
  apps: [
    {
      name: "prizzo-api",
      script: "src/server.js",
      instances: "max",           // Auto-detect CPU cores
      exec_mode: "cluster",       // Cluster mode for horizontal scaling
      watch: false,
      max_memory_restart: "512M", // Restart if a worker exceeds 512MB

      // ── Environment Variables ──
      env: {
        NODE_ENV: "development",
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 5000,
      },

      // ── Logging ──
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      merge_logs: true,

      // ── Graceful Shutdown ──
      kill_timeout: 10000,        // 10s grace period before SIGKILL
      listen_timeout: 8000,       // 8s to wait for ready signal
      wait_ready: false,

      // ── Restart Policy ──
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 3000,
    },
  ],
};
