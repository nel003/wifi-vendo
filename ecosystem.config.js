module.exports = {
  apps: [
    {
      name: "app",
      script: "bash init.sh && npm run start",
      cwd: "/root/wifi-vendo",
      env_file: ".env.local",
      autorestart: true,
      watch: false,

      // Logging
      error_file: "/var/log/wifi-vendo-error.log",
      out_file: "/var/log/wifi-vendo-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      exec_mode: "fork",
      instances: 1
    }
  ]
};
