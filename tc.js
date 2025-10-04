#!/usr/bin/env node
/**
 * qos-client.js
 *
 * Usage:
 *   node qos-client.js add AA:BB:CC:DD:EE:FF
 *   node qos-client.js del AA:BB:CC:DD:EE:FF
 *
 * Requirements: run as root. Uses iptables, tc.
 *
 * Behavior:
 * - Deterministic MARK derived from MAC (last 4 hex digits -> decimal + offset)
 * - Adds iptables -t mangle rule matching MAC -> MARK
 * - Creates tc class (1:<mark>) with rate=SPEED and sfq qdisc
 * - Adds tc filter to route fw mark -> class
 * - Deletion removes iptables rule(s) and tc items
 */

import { execSync } from "child_process";

const LAN_IFACE = process.env.LAN_IFACE || "enx00e04c6701a9";
const SPEED = process.env.SPEED || "5mbit";
const ROOT_RATE = process.env.ROOT_RATE || "100mbit";
const TC_ROOT = process.env.TC_ROOT || "1:";
const DEFAULT_CLASS = process.env.DEFAULT_CLASS || 10;
const MARK_OFFSET = Number(process.env.MARK_OFFSET || 1000);

function sh(cmd, { silent = false } = {}) {
  try {
    const out = execSync(cmd, { stdio: silent ? "ignore" : "pipe" }).toString().trim();
    return { ok: true, out };
  } catch (err) {
    return { ok: false, err };
  }
}

function log(...args) {
  console.log(new Date().toISOString(), ...args);
}

function ensureRoot() {
  if (typeof process.getuid === "function" && process.getuid() !== 0) {
    console.error("This script must be run as root.");
    process.exit(1);
  }
}

function macToMark(mac) {
  // Normalize MAC, remove non-hex, lowercase
  const clean = mac.replace(/[^a-fA-F0-9]/g, "").toLowerCase();
  if (clean.length < 4) throw new Error("MAC is too short");
  const last4 = clean.slice(-4);
  const dec = parseInt(last4, 16);
  // keep within safe range and add offset
  const mark = MARK_OFFSET + (dec % 60000);
  return mark;
}

function ensureRootTc() {
  // Check if a htb root exists
  const check = sh(`tc qdisc show dev ${LAN_IFACE}`);
  if (!check.ok || !/htb/.test(check.out)) {
    log("Creating TC root and default class...");
    sh(`tc qdisc add dev ${LAN_IFACE} root handle ${TC_ROOT} htb default ${DEFAULT_CLASS}`);
    sh(`tc class add dev ${LAN_IFACE} parent ${TC_ROOT} classid 1:1 htb rate ${ROOT_RATE} ceil ${ROOT_RATE}`);
    sh(`tc class add dev ${LAN_IFACE} parent 1:1 classid 1:${DEFAULT_CLASS} htb rate ${ROOT_RATE} ceil ${ROOT_RATE}`);
    sh(`tc qdisc add dev ${LAN_IFACE} parent 1:${DEFAULT_CLASS} handle ${DEFAULT_CLASS}: sfq`);
  } else {
    log("TC root present");
  }
}

function iptablesHasMacRule(mac, mark) {
  // Use iptables -t mangle -C ... to check
  const cmd = `iptables -t mangle -C PREROUTING -i ${LAN_IFACE} -m mac --mac-source ${mac} -j MARK --set-mark ${mark}`;
  return sh(cmd).ok;
}

function addIptablesMacRule(mac, mark) {
  if (iptablesHasMacRule(mac, mark)) {
    log(`iptables rule for ${mac} -> mark ${mark} already exists`);
    return;
  }
  const cmd = `iptables -t mangle -I PREROUTING -i ${LAN_IFACE} -m mac --mac-source ${mac} -j MARK --set-mark ${mark}`;
  const res = sh(cmd);
  if (!res.ok) log("Failed to add iptables rule:", res.err.message || res.err);
  else log(`Added iptables rule for ${mac} -> mark ${mark}`);
}

function delIptablesMacRule(mac, mark) {
  // Remove all matching rules (loop until iptables -C fails)
  while (iptablesHasMacRule(mac, mark)) {
    const res = sh(`iptables -t mangle -D PREROUTING -i ${LAN_IFACE} -m mac --mac-source ${mac} -j MARK --set-mark ${mark}`);
    if (!res.ok) {
      log("Failed to delete iptables rule (may already be removed):", res.err.message || res.err);
      break;
    }
    log(`Deleted an iptables rule for ${mac} -> mark ${mark}`);
  }
}

function tcFilterExists(mark) {
  const res = sh(`tc filter show dev ${LAN_IFACE} parent 1:0`);
  if (!res.ok) return false;
  return new RegExp(`handle ${mark} fw`).test(res.out);
}

function addClient(mac) {
  const mark = macToMark(mac);
  ensureRootTc();

  // iptables
  addIptablesMacRule(mac, mark);

  // tc class & qdisc (ignore errors if already exist)
  sh(`tc class add dev ${LAN_IFACE} parent 1:1 classid 1:${mark} htb rate ${SPEED} ceil ${SPEED}`, { silent: true });
  sh(`tc qdisc add dev ${LAN_IFACE} parent 1:${mark} handle ${mark}: sfq`, { silent: true });

  // tc filter for fw mark
  if (!tcFilterExists(mark)) {
    sh(`tc filter add dev ${LAN_IFACE} parent 1:0 protocol ip prio 1 handle ${mark} fw flowid 1:${mark}`, { silent: true });
    log(`tc filter/class added for mark ${mark} (MAC ${mac}, speed ${SPEED})`);
  } else {
    log(`tc filter already exists for mark ${mark}`);
  }
}

function delClient(mac) {
  const mark = macToMark(mac);

  // remove iptables rules
  delIptablesMacRule(mac, mark);

  // delete tc filter/class/qdisc (ignore failures)
  sh(`tc filter del dev ${LAN_IFACE} parent 1:0 protocol ip prio 1 handle ${mark} fw flowid 1:${mark}`, { silent: true });
  sh(`tc qdisc del dev ${LAN_IFACE} parent 1:${mark}`, { silent: true });
  sh(`tc class del dev ${LAN_IFACE} parent 1:1 classid 1:${mark}`, { silent: true });

  log(`Removed shaping for MAC ${mac} (mark ${mark})`);
}

function usage() {
  console.error("Usage: qos-client.js {add|del} <MAC>");
  process.exit(2);
}

function main() {
  ensureRoot();
  const args = process.argv.slice(2);
  if (args.length !== 2) usage();
  const [cmd, macRaw] = args;
  const mac = macRaw.toLowerCase();

  try {
    if (cmd === "add") addClient(mac);
    else if (cmd === "del") delClient(mac);
    else usage();
  } catch (e) {
    console.error("Error:", e.message || e);
    process.exit(1);
  }
}

if (require.main === module) main();
