module.exports = {
  apps: [
    {
      name: "pegasus-backend",
      script: "./index.js",
      instances: "max", // Spawns an instance per CPU core (e.g., 8 on a KVM8 VPS)
      exec_mode: "cluster", // Enables PM2's cluster mode for load balancing
      watch: false, // Don't watch for file changes in production to save CPU
      env: {
        NODE_ENV: "production",
      },
      env_development: {
        NODE_ENV: "development",
        watch: true,
      },
      max_memory_restart: "1G", // Auto-restart if process uses more than 1GB RAM to prevent leaks
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      merge_logs: true
    }
  ]
};
