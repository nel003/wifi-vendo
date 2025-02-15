
# Captive Portal Setup

This document provides a complete guide to setting up a captive portal on a Linux system using the following components:

- **systemd-resolved** for DNS resolution
- **dnsmasq** for DNS and DHCP services
- **iptables/ipset** for traffic redirection and captive portal enforcement
- **Node.js** (installed via **nvm**) for the application backend
- **pm2** to manage the Node.js process
- **nginx** as a reverse proxy
- **MySQL** for database support

---

## Table of Contents

- [System DNS Configuration](#system-dns-configuration)
- [Dnsmasq Installation and Configuration](#dnsmasq-installation-and-configuration)
- [Systemd Override for dnsmasq](#systemd-override-for-dnsmasq)
- [Installing Required Packages](#installing-required-packages)
- [Installing Node.js with NVM](#installing-nodejs-with-nvm)
- [Configuring iptables and rc.local](#configuring-iptables-and-rclocal)
- [Setting Up pm2](#setting-up-pm2)
- [Nginx Reverse Proxy Setup](#nginx-reverse-proxy-setup)
- [MySQL Database Setup](#mysql-database-setup)
- [Cloning and Building the Project](#cloning-and-building-the-project)
- [Additional Notes](#additional-notes)
- [Conclusion](#conclusion)

---

## System DNS Configuration

1. **Edit `/etc/systemd/resolved.conf`:**

   ```bash
   sudo nano /etc/systemd/resolved.conf
   ```

   Insert or update the following:

   ```ini
   [Resolve]
   DNS=8.8.8.8 8.8.4.4
   FallbackDNS=1.1.1.1 1.0.0.1
   ```

2. **Restart the service:**

   ```bash
   sudo systemctl restart systemd-resolved
   ```

---

## Dnsmasq Installation and Configuration

1. **Install dnsmasq:**

   ```bash
   sudo apt install dnsmasq
   ```

2. **Edit `/etc/dnsmasq.conf`:**

   ```bash
   sudo nano /etc/dnsmasq.conf
   ```

   Insert the following configuration (adjust interface names, IP ranges, and domain as needed):

   ```ini
   # Listen only on LAN interface 
   interface=enx00e0990026d3

   # Prevent listening on other interfaces
   bind-interfaces

   # Set the domain name
   domain=home.local

   # Use Google DNS (you can change this)
   server=8.8.8.8
   server=8.8.4.4

   # Enable DHCP server with a range of IP addresses and a lease time of 12 hours
   dhcp-range=192.168.2.101,192.168.2.200,12h

   # Set gateway (router) for DHCP clients
   dhcp-option=3,192.168.2.1
   dhcp-option=6,192.168.2.1

   # Set subnet mask and broadcast address
   dhcp-option=1,255.255.255.0
   dhcp-option=28,192.168.2.255

   # Custom DHCP option (if needed)
   dhcp-option=lan,114,http://nel.wifi

   # Redirect specific domain requests to the captive portal
   address=/ariel.wifi/192.168.2.1
   address=/connectivitycheck.gstatic.com/192.168.2.1
   address=/connectivitycheck.android.com/192.168.2.1
   address=/clients1.google.com/192.168.2.1
   address=/clients3.google.com/192.168.2.1
   address=/clients.4.google.com/192.168.2.1
   address=/captive.apple.com/192.168.2.1
   address=/msftconnecttest.com/192.168.2.1

   # Enable logging
   log-queries
   log-dhcp
   ```

---

## Systemd Override for dnsmasq

1. **Create the override directory and file:**

   ```bash
   sudo mkdir -p /etc/systemd/system/dnsmasq.service.d
   sudo nano /etc/systemd/system/dnsmasq.service.d/override.conf
   ```

2. **Add the following content:**

   ```ini
   [Unit]
   After=network-online.target
   Wants=network-online.target
   ```

3. **Reload systemd and restart dnsmasq:**

   ```bash
   sudo systemctl daemon-reload
   sudo systemctl restart dnsmasq
   sudo systemctl enable dnsmasq
   sudo systemctl status dnsmasq
   ```

---

## Installing Required Packages

Update your package lists and install additional dependencies:

```bash
sudo apt update
sudo apt install -y iptables ipset build-essential python3 libatomic1 ntpdate make g++
```

---

## Installing Node.js with NVM

1. **Install nvm:**

   ```bash
   curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
   source ~/.bashrc
   ```

2. **Install the LTS version of Node.js:**

   ```bash
   nvm install --lts
   ```

---

## Configuring iptables and rc.local

1. **Edit `/etc/rc.local`:**

   ```bash
   sudo nano /etc/rc.local
   ```

2. **Paste the following content (adjust interface names and IP addresses as needed):**

   ```bash
   #!/bin/bash
   # /etc/rc.local

   # Create an ipset for allowed MAC addresses
   ipset create allowed_macs hash:mac

   # Allow whitelisted MACs: bypass captive portal redirection for these MAC addresses
   iptables -t mangle -A PREROUTING -i enx00e0990026d3 -m set --match-set allowed_macs src -j ACCEPT

   # Mark all other traffic on the LAN interface for redirection
   iptables -t mangle -A PREROUTING -i enx00e0990026d3 -j MARK --set-mark 99

   # Redirect HTTP (port 80) and HTTPS (port 443) traffic for marked packets to the captive portal on port 3000
   iptables -t nat -A PREROUTING -i enx00e0990026d3 -m mark --mark 99 -p tcp --dport 80 -j DNAT --to 192.168.2.1:80
   iptables -t nat -A PREROUTING -i enx00e0990026d3 -m mark --mark 99 -p tcp --dport 443 -j DNAT --to 192.168.2.1:80

   # Block unauthorized forwarding for marked packets
   iptables -A FORWARD -i enx00e0990026d3 -m mark --mark 99 -j DROP

   # Masquerade outgoing traffic on the WAN interface (replace 'end0' with your actual WAN interface if different)
   iptables -t nat -A POSTROUTING -o end0 -j MASQUERADE

   # Synchronize system time
   ntpdate -u time.nist.gov

   # Enable IP forwarding
   sysctl -w net.ipv4.ip_forward=1

   # rc.local must exit with 0
   exit 0
   ```

3. **Make the script executable:**

   ```bash
   sudo chmod +x /etc/rc.local
   ```

4. **Set up a cron job to run the script at reboot:**

   ```bash
   crontab -e
   ```

   Add the following line:

   ```cron
   @reboot /bin/bash /etc/rc.local
   ```

---

## Setting Up pm2

Install pm2 globally to manage your Node.js application:

```bash
npm i -g pm2
```

---

## Nginx Reverse Proxy Setup

1. **Install nginx:**

   ```bash
   sudo apt install nginx -y
   ```

2. **Create a new site configuration:**

   ```bash
   sudo nano /etc/nginx/sites-available/nodeapp
   ```

3. **Insert the following configuration (modify `yourdomain.com` or use `_` to catch all requests):**

   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_set_header Host $host;
       }
   }
   ```

4. **Enable the configuration and remove the default site:**

   ```bash
   sudo ln -s /etc/nginx/sites-available/nodeapp /etc/nginx/sites-enabled/
   sudo rm /etc/nginx/sites-enabled/default
   ```

5. **Test and restart nginx:**

   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   sudo systemctl enable nginx
   ```

---

## MySQL Database Setup

1. **Secure your MySQL installation:**

   ```bash
   sudo mysql_secure_installation
   ```

2. **Create a new database:**

   ```bash
   sudo mysql -u root -p
   ```

   Then, in the MySQL prompt, run:

   ```sql
   CREATE DATABASE wifi;
   exit;
   ```

3. **If you have an initialization file (`tables.sql`), load it:**

   ```bash
   mysql -u root -p wifi < tables.sql
   ```

---

## Cloning and Building the Project

1. **Clone the repository:**

   ```bash
   git clone https://github.com/nel003/wifi-vendo
   cd wifi-vendo
   ```

2. **Install dependencies and build the project:**

   ```bash
   npm i
   npm run build
   ```

3. **Start the application using pm2 (example command):**

   ```bash
   pm2 start npm --name "wifi-vendo" -- run start
   ```

---

## Additional Notes

- **Interface Names & IPs:**  
  Ensure that the network interface names (e.g., `enx00e0990026d3`, `end0`) and IP ranges in the configurations match your setup.

- **iptables Rules:**  
  The rules in `/etc/rc.local` redirect HTTP/HTTPS traffic to the captive portal running on port 80. Modify these if your configuration differs.

- **DNS Redirection:**  
  The dnsmasq configuration redirects specific domains (e.g., captive portal check domains) to the local IP. Update these if necessary.

- **Service Order:**  
  The systemd override for dnsmasq guarantees that it starts only after the network is online.

- **Persistence:**  
  The `/etc/rc.local` script, invoked at reboot via cron, applies the necessary iptables/ipset rules. Ensure this script works as expected on boot.

---
