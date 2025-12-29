#!/bin/bash
set -e

# -----------------------------
# Must be run as root
# -----------------------------
if [[ $EUID -ne 0 ]]; then
  echo "❌ Please run as root (sudo)"
  exit 1
fi

# -----------------------------
# Ask for user input
# -----------------------------
read -rp "👤 Enter DB username you want: " MYSQL_USER

if [[ -z "$MYSQL_USER" ]]; then
  echo "❌ Username cannot be empty"
  exit 1
fi

read -s -p "🔐 Enter DB password: " MYSQL_PASS
echo
read -s -p "🔐 Confirm DB password: " MYSQL_PASS_CONFIRM
echo

if [[ "$MYSQL_PASS" != "$MYSQL_PASS_CONFIRM" ]]; then
  echo "❌ Passwords do not match"
  exit 1
fi
# -----------------------------
# Ask for domain
# -----------------------------
read -rp "🌐 Enter captive portal domain (e.g. nel.wifi): " DOMAIN

if [[ -z "$DOMAIN" ]]; then
  echo "❌ Domain cannot be empty"
  exit 1
fi

# -----------------------------
# Generate strong APP SECRET
# -----------------------------
SECRET=$(openssl rand -hex 32)

echo "🔐 Generated APP SECRET"

# -----------------------------
# Detect WAN Interface
# -----------------------------
WAN_IFACE=$(ip route show default 2>/dev/null | awk '{print $5}' | head -n1)

if [[ -z "$WAN_IFACE" ]]; then
  echo "❌ WAN interface not detected (no default route)"
  exit 1
fi

# -----------------------------
# Detect LAN Interface
# -----------------------------
LAN_IFACE=""

for iface in $(ls /sys/class/net); do
  # Skip loopback and WAN
  [[ "$iface" == "lo" ]] && continue
  [[ "$iface" == "$WAN_IFACE" ]] && continue
  # Skip WiFi (optional)
  [[ "$iface" == wl* ]] && continue
  # Interface must be UP
  state=$(cat /sys/class/net/$iface/operstate)
  [[ "$state" != "up" ]] && continue
  # Ethernet only
  [[ ! -d "/sys/class/net/$iface/device" ]] && continue
  LAN_IFACE="$iface"
  break
done

if [[ -z "$LAN_IFACE" ]]; then
  echo "❌ LAN interface not detected"
  exit 1
fi

# -----------------------------
# Output
# -----------------------------
echo "✅ WAN Interface: $WAN_IFACE"
echo "✅ LAN Interface: $LAN_IFACE"

NETPLAN_DIR="/etc/netplan"

# -----------------------------
# Check variables
# -----------------------------
if [[ -z "$WAN_IFACE" || -z "$LAN_IFACE" ]]; then
  echo "❌ WAN_IFACE or LAN_IFACE not set"
  echo "👉 Run the WAN/LAN detection script first"
  exit 1
fi

# -----------------------------
# List netplan files
# -----------------------------
echo "📂 Netplan files:"
ls -1 "$NETPLAN_DIR"

# -----------------------------
# Get first netplan file
# -----------------------------
NETPLAN_FILE=$(ls -1 "$NETPLAN_DIR"/*.yaml 2>/dev/null | head -n 1)

if [[ -z "$NETPLAN_FILE" ]]; then
  echo "❌ No netplan YAML file found"
  exit 1
fi

# -----------------------------
# Backup
# -----------------------------
BACKUP_FILE="${NETPLAN_FILE}.bak"
cp "$NETPLAN_FILE" "$BACKUP_FILE"

echo "✅ Backup created: $BACKUP_FILE"

# -----------------------------
# Write new config
# -----------------------------
cat <<EOF > "$NETPLAN_FILE"
network:
  version: 2
  ethernets:
    $WAN_IFACE:
      dhcp4: true   # WAN (Uses DHCP)
    $LAN_IFACE:
      dhcp4: no     # LAN (Static IP)
      addresses: [10.0.0.1/24]
      nameservers:
        addresses: [8.8.8.8, 8.8.4.4]
EOF

echo "✅ Netplan configuration updated"

# -----------------------------
# Apply netplan
# -----------------------------
sudo netplan generate
sudo netplan apply

echo "🚀 Netplan applied successfully"
echo "🔍 Verifying IP configuration..."

WAN_IP=$(ip -4 addr show "$WAN_IFACE" | awk '/inet / {print $2}')
LAN_IP=$(ip -4 addr show "$LAN_IFACE" | awk '/inet / {print $2}')

if [[ -z "$WAN_IP" ]]; then
  echo "❌ WAN has no IPv4 address"
else
  echo "✅ WAN ($WAN_IFACE) IP: $WAN_IP"
fi

if [[ "$LAN_IP" == "10.0.0.1/24" ]]; then
  echo "✅ LAN ($LAN_IFACE) IP correctly set to $LAN_IP"
else
  echo "❌ LAN IP incorrect or missing: $LAN_IP"
fi

echo "📦 Updating package list..."
apt update

echo "📦 Installing required packages..."
apt install -y \
  iptables \
  ipset \
  dnsmasq \
  build-essential \
  python3 \
  libatomic1 \
  ntpdate \
  nginx \
  mariadb-server \
  make \
  g++

echo "✅ All packages installed successfully"

# -----------------------------
# Check LAN_IFACE
# -----------------------------
if [[ -z "$LAN_IFACE" ]]; then
  echo "❌ LAN_IFACE not set"
  echo "👉 Export LAN_IFACE first"
  exit 1
fi

DNSMASQ_CONF="/etc/dnsmasq.conf"
BACKUP_CONF="/etc/dnsmasq.conf.bak"

# -----------------------------
# Backup existing config
# -----------------------------
if [[ -f "$DNSMASQ_CONF" ]]; then
  cp "$DNSMASQ_CONF" "$BACKUP_CONF"
  echo "✅ Backup created: $BACKUP_CONF"
else
  echo "⚠️ dnsmasq.conf not found, creating new one"
fi

# -----------------------------
# Write new config
# -----------------------------
cat <<EOF > "$DNSMASQ_CONF"
# Listen only on LAN interface
interface=$LAN_IFACE

# Prevent listening on other interfaces
bind-interfaces

# Set the domain name
domain=home.local

# Use Google DNS
server=8.8.8.8
server=8.8.4.4

# Enable DHCP server
dhcp-range=10.0.0.20,10.0.0.98,4h
dhcp-range=10.0.0.100,10.0.0.245,4h

# Set gateway (router)
dhcp-option=3,10.0.0.1
dhcp-option=6,10.0.0.1

# Set subnet mask
dhcp-option=1,255.255.255.0

# Set broadcast address
dhcp-option=28,10.0.0.255

# Captive portal option
dhcp-option=lan,114,http://$DOMAIN

# DNS redirection for captive portal and connectivity checks
address=/$DOMAIN/10.0.0.1
address=/connectivitycheck.gstatic.com/10.0.0.1
address=/connectivitycheck.android.com/10.0.0.1
address=/clients1.google.com/10.0.0.1
address=/clients3.google.com/10.0.0.1
address=/clients.4.google.com/10.0.0.1
address=/captive.apple.com/10.0.0.1
address=/msftconnecttest.com/10.0.0.1

# Logging
log-queries
log-dhcp
EOF

echo "✅ dnsmasq configuration written"

# -----------------------------
# Restart dnsmasq
# -----------------------------
systemctl restart dnsmasq
systemctl enable dnsmasq

echo "🚀 dnsmasq restarted successfully"
echo "🌐 Captive portal domain: http://$DOMAIN"

# -----------------------------
# systemd override for dnsmasq
# -----------------------------
OVERRIDE_DIR="/etc/systemd/system/dnsmasq.service.d"
OVERRIDE_FILE="$OVERRIDE_DIR/override.conf"

mkdir -p "$OVERRIDE_DIR"

cat <<EOF > "$OVERRIDE_FILE"
[Unit]
After=network-online.target
Wants=network-online.target
EOF

echo "✅ Created systemd override: $OVERRIDE_FILE"

# Reload systemd and restart dnsmasq
systemctl daemon-reload
systemctl restart dnsmasq
systemctl enable dnsmasq
systemctl is-active dnsmasq && echo "✅ dnsmasq is running"

echo "🚀 dnsmasq restarted with network-online dependency"

echo "📦 Installing NVM..."
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash

# -----------------------------
# Load NVM (non-interactive safe)
# -----------------------------
export NVM_DIR="$HOME/.nvm"

if [[ -s "$NVM_DIR/nvm.sh" ]]; then
  # shellcheck source=/dev/null
  source "$NVM_DIR/nvm.sh"
else
  echo "❌ NVM not found after installation"
  exit 1
fi

echo "📦 Installing Node.js v22"
nvm install 22

echo "✅ Node.js installed successfully"

# -----------------------------
# Verify
# -----------------------------
echo "🔍 Versions:"
node -v
npm -v

TARGET="/usr/local/sbin/setup-network.sh"
mkdir -p /usr/local/sbin

cat <<'EOF' > "$TARGET"
#!/bin/bash
# setup-network.sh — SAFE CAKE + IFB + firewall
set -e

WAN_IFACE="$WAN_IFACE"
LAN_IFACE="$LAN_IFACE"
SPEED="50mbit"   # TOTAL internet speed (not per-client)

echo "=== Network shaping start ==="

# ---------------------------
# Disable offloading (required for CAKE)
# ---------------------------
ethtool -K "$WAN_IFACE" gro off gso off || true

# ---------------------------
# IFB setup (idempotent)
# ---------------------------
modprobe ifb

ip link show ifb0 >/dev/null 2>&1 || ip link add ifb0 type ifb
ip link set ifb0 up

tc qdisc del dev "$WAN_IFACE" ingress 2>/dev/null || true
tc qdisc add dev "$WAN_IFACE" handle ffff: ingress

tc filter add dev "$WAN_IFACE" parent ffff: protocol ip u32 match u32 0 0 \
  action mirred egress redirect dev ifb0 2>/dev/null || true

# ---------------------------
# CAKE (DOWNLOAD & UPLOAD)
# ---------------------------
tc qdisc replace dev ifb0 root cake bandwidth "$SPEED" nat dual-dsthost
tc qdisc replace dev "$WAN_IFACE" root cake bandwidth "$SPEED" nat dual-srchost

# ---------------------------
# IPSET
# ---------------------------
ipset create allowed_macs hash:mac timeout 2147483 -exist

# ---------------------------
# IPTABLES (NO GLOBAL FLUSH)
# ---------------------------

iptables -t mangle -D PREROUTING -i "$LAN_IFACE" -m set ! --match-set allowed_macs src \
  -j MARK --set-mark 99 2>/dev/null || true

iptables -t mangle -A PREROUTING -i "$LAN_IFACE" \
  -m set ! --match-set allowed_macs src -j MARK --set-mark 99

iptables -t nat -D PREROUTING -i "$LAN_IFACE" -m mark --mark 99 -p tcp --dport 80 \
  -j DNAT --to 10.0.0.1 2>/dev/null || true

iptables -t nat -A PREROUTING -i "$LAN_IFACE" -m mark --mark 99 -p tcp --dport 80 \
  -j DNAT --to 10.0.0.1

iptables -C FORWARD -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT 2>/dev/null \
  || iptables -A FORWARD -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT

iptables -C FORWARD -i "$LAN_IFACE" -m mark --mark 99 -j DROP 2>/dev/null \
  || iptables -A FORWARD -i "$LAN_IFACE" -m mark --mark 99 -j DROP

iptables -t nat -C POSTROUTING -o "$WAN_IFACE" -j MASQUERADE 2>/dev/null \
  || iptables -t nat -A POSTROUTING -o "$WAN_IFACE" -j MASQUERADE

# Disable hotspot sharing by setting TTL to 1 on LAN outbound traffic
iptables -t mangle -C POSTROUTING -o "$LAN_IFACE" -j TTL --ttl-set 1 2>/dev/null \
  || iptables -t mangle -A POSTROUTING -o "$LAN_IFACE" -j TTL --ttl-set 1
  
# ---------------------------
# SYSCTL (SAFE VALUES)
# ---------------------------
sysctl -w net.ipv4.ip_forward=1
sysctl -w net.netfilter.nf_conntrack_max=65536
sysctl -w net.netfilter.nf_conntrack_tcp_timeout_established=43200
sysctl -w net.netfilter.nf_conntrack_udp_timeout=30
sysctl -w net.ipv4.tcp_tw_reuse=1

#bash /root/wifi-vendo/init.sh

echo "✅ Network shaping applied successfully"
EOF

chmod +x "$TARGET"

echo "✅ Created executable: $TARGET"

SERVICE_FILE="/etc/systemd/system/network-shaping.service"

cat <<'EOF' > "$SERVICE_FILE"
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
EOF

echo "✅ Created service: $SERVICE_FILE"

# Reload systemd and enable service
systemctl daemon-reload
systemctl enable network-shaping.service
systemctl start network-shaping.service

echo "🚀 network-shaping.service enabled (runs at boot)"

NGINX_SITE="/etc/nginx/sites-available/nodeapp"

cat <<'EOF' > "$NGINX_SITE"
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
EOF

echo "✅ Created nginx site config: $NGINX_SITE"

ln -sf /etc/nginx/sites-available/nodeapp /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

nginx -t
systemctl restart nginx
systemctl enable nginx

echo "🔐 Securing MySQL (MySQL 8 safe & idempotent)"

mysql <<'EOF'
-- ---------------------------
-- Remove anonymous users
-- ---------------------------
DROP USER IF EXISTS ''@'localhost';
DROP USER IF EXISTS ''@'%';

-- ---------------------------
-- Remove remote root (if exists)
-- ---------------------------
DROP USER IF EXISTS 'root'@'%';

-- ---------------------------
-- Remove test database
-- ---------------------------
DROP DATABASE IF EXISTS test;

-- ---------------------------
-- Reload privileges
-- ---------------------------
FLUSH PRIVILEGES;
EOF

echo "✅ MySQL secured successfully"

DB_NAME="wifi"
echo "🛢️ Creating MySQL database: $DB_NAME"

mysql -u root <<EOF
CREATE DATABASE IF NOT EXISTS \`$DB_NAME\`;
EOF
mysql -u root -p wifi < tables.sql

echo "✅ Database '$DB_NAME' is ready"

# -----------------------------
# Create user & grant privileges
# -----------------------------
mysql <<EOF
CREATE USER IF NOT EXISTS '$MYSQL_USER'@'localhost'
IDENTIFIED BY '$MYSQL_PASS';

GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '$MYSQL_USER'@'localhost';

FLUSH PRIVILEGES;
EOF

echo "✅ MySQL user '$MYSQL_USER' created"
echo "✅ Full access granted to database '$DB_NAME'"

ENV_FILE=".env.local"
# -----------------------------
# Create .env.local
# -----------------------------
cat <<EOF > "$ENV_FILE"
PROD=true
SECRET=$SECRET

INTERFACE=$LAN_IFACE

DB_HOST=127.0.0.1
DB_USER=$MYSQL_USER
DB_PASSWORD=$MYSQL_PASS
DB_NAME=wifi

MAIN_URL=http://$DOMAIN
TIMEOUT=30
EOF

echo "✅ .env.local created successfully"
