
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

Create and configure `/usr/local/sbin/setup-network.sh` to set up firewall rules and network settings:

```bash
sudo nano /usr/local/sbin/setup-network.sh
```

Paste the following script:

```bash
#!/bin/bash
# setup-network.sh
# Combined script for tc traffic shaping, ipset/iptables rules, and NAT configuration

# ---------------------------
# Interface Variables
# ---------------------------
WAN_IFACE="end0"                # Replace with your WAN interface
LAN_IFACE="enx00e04c6701a9"      # Replace with your LAN interface

# ---------------------------
# Clear and Initialize TC (Traffic Control)
# ---------------------------
echo "Clearing existing tc rules on $LAN_IFACE..."
tc qdisc del dev "$LAN_IFACE" root 2>/dev/null || true

echo "Setting up HTB root qdisc with r2q option..."
tc qdisc add dev "$LAN_IFACE" root handle 1: htb default 99 r2q 10

echo "Adding parent HTB class..."
tc class add dev "$LAN_IFACE" parent 1: classid 1:1 htb rate 1000mbit

# Note: We are not creating a default unauthorized class here.
# Unauthorized devices (or devices not in the DHCP range) will fall back to the default (mark 99)
# and will be intercepted by iptables (see below).

# ---------------------------
# Set up Per-IP TC Classes (DHCP range 10.0.0.20-10.0.0.245)
# ---------------------------
echo "Setting up per-IP tc classes for 10.0.0.20 to 10.0.0.245..."
for ip_suffix in $(seq 20 245); do
  ip="10.0.0.${ip_suffix}"
  mark="$ip_suffix"                                   # Use the last octet as the mark (must be ≤ 255)
  classid_hex=$(printf "%x" "$ip_suffix")             # Convert to hex for a valid tc class ID

  # Create HTB class (with 15Mbps rate limit; adjust to 5mbit below if desired)
  tc class add dev "$LAN_IFACE" parent 1:1 classid 1:"$classid_hex" htb rate 15mbit ceil 15mbit burst 15k

  # Attach a fair qdisc to the class
  tc qdisc add dev "$LAN_IFACE" parent 1:"$classid_hex" handle "${ip_suffix}:" sfq perturb 10

  # Mark packets from this specific IP via iptables (see below for details)
  iptables -t mangle -A PREROUTING -i "$LAN_IFACE" -s "$ip" -j MARK --set-mark "$mark"

  # Link the mark to the corresponding tc class via filter
  tc filter add dev "$LAN_IFACE" parent 1: protocol ip handle "$mark" fw flowid 1:"$classid_hex"
done

# ---------------------------
# Setup ipset for Allowed MAC Addresses
# ---------------------------
echo "Creating ipset for allowed MAC addresses..."
ipset create allowed_macs hash:mac timeout 2147483 -exist

# ---------------------------
# Setup iptables Rules
# ---------------------------

# Flush previous mangle table rules (optional, to avoid duplicates)
iptables -t mangle -F

# 1. Accept traffic from allowed (whitelisted) MAC addresses
iptables -t mangle -A PREROUTING -i "$LAN_IFACE" -m set --match-set allowed_macs src -j ACCEPT

# 2. For non-whitelisted MACs, mark their packets as 99 (unauthorized)
iptables -t mangle -A PREROUTING -i "$LAN_IFACE" -m set ! --match-set allowed_macs src -j MARK --set-mark 99

# 3. (Optional) Redirect unauthorized web traffic (mark 99) to captive portal.
# Replace 10.0.0.1 with your captive portal IP.
iptables -t nat -A PREROUTING -i "$LAN_IFACE" -m mark --mark 99 -p tcp --dport 80 -j DNAT --to-destination 10.0.0.1
iptables -t nat -A PREROUTING -i "$LAN_IFACE" -m mark --mark 99 -p tcp --dport 443 -j DNAT --to-destination 10.0.0.1

# 4. Drop forwarded traffic from unauthorized devices (if desired)
iptables -A FORWARD -i "$LAN_IFACE" -m mark --mark 99 -j DROP

# ---------------------------
# NAT and Additional Settings
# ---------------------------
echo "Setting up NAT and additional settings..."
iptables -t nat -A POSTROUTING -o "$WAN_IFACE" -j MASQUERADE

# Disable hotspot sharing by setting TTL to 1 on LAN outbound traffic
iptables -t mangle -A POSTROUTING -o "$LAN_IFACE" -j TTL --ttl-set 1

# Enable IP forwarding
sysctl -w net.ipv4.ip_forward=1

# Sync system time (optional, adjust if necessary)
ntpdate time.google.com

# (Optional) Restart any required applications (e.g., captive portal server or pm2-managed app)
pm2 restart app

echo "Network shaping and firewall configuration applied successfully."

exit 0
```

Make the script executable:

```bash
sudo chmod +x /usr/local/sbin/setup-network.sh
```

###Create the systemd Service File:
Create a file called /etc/systemd/system/network-shaping.service
```bash
nano /etc/systemd/system/network-shaping.service
```

Paste the following line:

```bash
[Unit]
Description=Network Shaping, TC, and iptables Setup
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/local/sbin/setup-network.sh
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
```
Enable and Start the Service
```bash
sudo systemctl daemon-reload
sudo systemctl enable network-shaping.service
sudo systemctl start network-shaping.service
```

You can check its status with:
```bash
sudo systemctl status network-shaping.service
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
NEXT_PUBLIC_HAS_COINSLOT=false
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
