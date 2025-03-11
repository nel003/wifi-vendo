
# WiFi Vendo Captive Portal Setup

This guide provides step-by-step instructions for setting up a captive portal using systemd-resolved, dnsmasq, iptables, NGINX, MySQL, and a Node.js application managed by PM2. This configuration supports DNS/DHCP services on your LAN and redirects unauthorized traffic to a captive portal.

> **Note:** Adjust interface names (e.g., `enx00e0990026d3` and `end0`), IP addresses, and domain names to suit your environment.

---

## Prerequisites

- A Debian/Ubuntu-based system with `sudo` privileges.
- Basic familiarity with Linux command-line operations.
- An active internet connection for package installation.

---

## 1. Set LAN IP to static
### For Debian/Ubuntu-Based Systems (Armbian, etc.)

Edit the network configuration file:

```bash
sudo nano /etc/network/interfaces
```

Modify or add the following lines (replace with your desired values):
```ini
# WAN (DHCP)
auto end0
iface end0 inet dhcp

# LAN (Static IP)
auto end0s8
iface end0s8 inet static
address 10.0.0.1  # Your static IP
netmask 255.255.255.0  # Subnet mask
gateway 10.0.0.1  # Default gateway (if needed)
dns-nameservers 8.8.8.8 8.8.4.4  # Google DNS
```
Save and exit (CTRL+X, then Y, then Enter).

Restart networking:

```bash
sudo systemctl restart networking
```

### For Netplan-Based Systems

Edit the Netplan config:

```bash
sudo nano /etc/netplan/01-netcfg.yaml
```

Modify or add the following lines (replace with your desired values):
```ini
network:
  ethernets:
    end0:
      dhcp4: true  # WAN (Uses DHCP)
    end0s8:
      dhcp4: no    # LAN (Static IP)
      addresses: [10.0.0.1/24]
      gateway4: 10.0.0.1
      nameservers:
        addresses: [8.8.8.8, 8.8.4.4]
  version: 2
```
Save and exit (CTRL+X, then Y, then Enter).

Save and apply the changes:

```bash
sudo netplan generate
sudo netplan apply
```

### Verify Your Network Settings
After making the changes, check:
```bash
ip a
```
---

## 2. Install and Configure dnsmasq

### Install dnsmasq

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install dnsmasq
```

### Configure dnsmasq

Edit the configuration file:

```bash
sudo nano /etc/dnsmasq.conf
```

Paste the following configuration (modify as needed):

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

# Enable DHCP server
dhcp-range=192.168.2.101,192.168.2.200,12h

# Set gateway (router)
dhcp-option=3,192.168.2.1
dhcp-option=6,192.168.2.1

# Set subnet mask
dhcp-option=1,255.255.255.0

# Set broadcast address
dhcp-option=28,192.168.2.255

dhcp-option=lan,114,http://nel.wifi

# DNS redirection for captive portal and connectivity checks
address=/ariel.wifi/192.168.2.1
address=/connectivitycheck.gstatic.com/192.168.2.1
address=/connectivitycheck.android.com/192.168.2.1
address=/clients1.google.com/192.168.2.1
address=/clients3.google.com/192.168.2.1
address=/clients.4.google.com/192.168.2.1
address=/captive.apple.com/192.168.2.1
address=/msftconnecttest.com/192.168.2.1

# Logging
log-queries
log-dhcp
```

### Ensure dnsmasq Starts After the Network Is Up

Create an override file for the dnsmasq service:

```bash
sudo mkdir -p /etc/systemd/system/dnsmasq.service.d
sudo nano /etc/systemd/system/dnsmasq.service.d/override.conf
```

Insert the following:

```ini
[Unit]
After=network-online.target
Wants=network-online.target
```

Reload systemd and restart dnsmasq:

```bash
sudo systemctl daemon-reload
sudo systemctl restart dnsmasq
sudo systemctl enable dnsmasq
sudo systemctl status dnsmasq
```

---

## 3. Install Required Packages

Update and install essential packages:

```bash
sudo apt update
sudo apt install -y iptables ipset build-essential python3 libatomic1 ntpdate make g++
```

---

## 4. Install Node.js via NVM

Install Node.js by using the Node Version Manager:

```bash
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
source ~/.bashrc
nvm install --lts
```

---

## 5. Configure Network Rules and Captive Portal Redirection

Create and configure `/etc/rc.local` to set up firewall rules and network settings:

```bash
sudo nano /etc/rc.local
```

Paste the following script:

```bash
#!/bin/bash
# /etc/rc.local
WAN_IFACE="enp0s3"  # Change to match your LAN interface
LAN_IFACE="enp0s8"  # Change to match your LAN interface

# Create an ipset for allowed MAC addresses
ipset create allowed_macs hash:mac timeout 2147483 -exist

# Allow whitelisted MACs on the LAN interface
iptables -t mangle -A PREROUTING -i $LAN_IFACE -m set --match-set allowed_macs src -j ACCEPT

# Block unauthorized MACs and Redirect to captive portal
iptables -t mangle -A PREROUTING -i $LAN_IFACE -m set ! --match-set allowed_macs src -j MARK --set-mark 99

iptables -t nat -A PREROUTING -i $LAN_IFACE -m mark --mark 99 -p tcp --dport 80 -j DNAT --to 192.168.2.1:80
iptables -t nat -A PREROUTING -i $LAN_IFACE -m mark --mark 99 -p tcp --dport 443 -j DNAT --to 192.168.2.1:80

iptables -A FORWARD -i $LAN_IFACE -m mark --mark 99 -j DROP

# **Traffic Control (tc) to Limit Per Client Bandwidth**
# Clear any existing tc rules
tc qdisc del dev $LAN_IFACE root 2>/dev/null

# Create a root queue
tc qdisc add dev $LAN_IFACE root handle 1: htb default 30

# Create a parent class with the maximum bandwidth
tc class add dev $LAN_IFACE parent 1: classid 1:1 htb rate 100mbit burst 15k

# Create a child class to limit each client to 15Mbps
tc class add dev $LAN_IFACE parent 1:1 classid 1:10 htb rate 15mbit ceil 15mbit burst 15k

# Apply per-client filtering using `iptables` marks
tc filter add dev $LAN_IFACE protocol ip parent 1:0 prio 1 u32 match ip src 0.0.0.0/0 flowid 1:10

# Enable NAT for outgoing traffic (dynamically detects external interface)
iptables -t nat -A POSTROUTING -o $WAN_IFACE -j MASQUERADE

# Sync system time properly
ntpdate time.google.com

# Enable IP forwarding
sysctl -w net.ipv4.ip_forward=1

# rc.local needs to exit with 0
exit 0
```

Make the script executable:

```bash
sudo chmod +x /etc/rc.local
```

Ensure the script runs at reboot by adding it to the crontab:

```bash
crontab -e
```

Add the following line:

```bash
@reboot /bin/bash /etc/rc.local
0 3 * * 1 /sbin/reboot
```

---
## 6. Install and Configure NGINX

### Install NGINX

```bash
sudo apt install nginx -y
```

### Configure NGINX as a Reverse Proxy

Create a new site configuration:

```bash
sudo nano /etc/nginx/sites-available/nodeapp
```

Insert the following configuration (modify `server_name` as necessary):

```nginx
server {
    listen 80;
    server_name yourdomain.com; # Change to your domain or use `_` for all requests

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_cache_bypass $http_upgrade;

        # Forwarding client information
        proxy_set_header Referrer "$scheme://$host$request_uri";
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
    }
}
```

Enable the configuration and disable the default site:

```bash
sudo ln -s /etc/nginx/sites-available/nodeapp /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
```

Test and restart NGINX:

```bash
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## 7. Set Up MySQL Database

### MySQL Installation

```bash
sudo apt install mariadb-server -y
sudo systemctl start mariadb
sudo systemctl enable mariadb
```

### Secure MySQL setup

```bash
sudo mysql_secure_installation
```

### Create Database

Log in to MySQL as root:

```bash
sudo mysql -u root -p
```

Inside the MySQL prompt, run:

```sql
CREATE DATABASE wifi;
exit;
```
---

## 8. Clone and Deploy the Node.js Application

### Clone the Repository

```bash
git clone https://github.com/nel003/wifi-vendo
cd wifi-vendo
```
### Import Table Schema

Import `tables.sql` file:

```bash
mysql -u root -p wifi < tables.sql
```

### Create or Modify environment variables

Run:
```bash
nano .env.local
```

Modify or add the following lines (replace with your desired values):
```bash
PROD=false
SECRET=<YOUR_SECRET>
GET_HASH=<ADMIN_PASSWORD>

INTERFACE=<LAN_INTERFACE>

DB_HOST=<HOST>
DB_USER=<USERNAME>
DB_PASSWORD=<PASSWORD>
DB_NAME=wifi

MAIN_URL=<YOUR_DOMAIN> #e.g http://nel.wifi
TIMEOUT=30

NEXT_PUBLIC_APP_NAME=<NAME> #e.g NEL WIFI
NEXT_PUBLIC_VERSION=2.0
```
Save and exit (CTRL+X, then Y, then Enter).

### Install Dependencies and Build

```bash
npm i
npm run build
```

### Set Up PM2 for Process Management

Install PM2 and TSX globally:

```bash
npm i -g pm2 tsx
```

Start the required processes:

```bash
pm2 start 'bash init.sh & npm run start' --name app
```

Save the PM2 process list and configure it to start on boot:

```bash
pm2 save
pm2 startup
```

---

## Conclusion

Your captive portal and WiFi management system should now be up and running. Be sure to verify and adjust any interface names, IP addresses, and domain names to match your specific setup. For additional troubleshooting and customization, consult the documentation for each tool (dnsmasq, iptables, NGINX, PM2, etc.).

Happy networking!
