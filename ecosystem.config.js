module.exports = {
  apps: [
    {
      name: "wifi-vendo",
      script: "app.js",
      cwd: "/root/wifi-vendo",
      env_file: ".env.local",
      pre_start: "bash init.sh",
      autorestart: true,
      watch: false,

      // Logging
      error_file: "/var/log/wifi-vendo-error.log",
      out_file: "/var/log/wifi-vendo-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",

      // Run as root (required for ipset)
      user: "root",

      // Node settings
      exec_mode: "fork",
      instances: 1
    }
  ]
};
