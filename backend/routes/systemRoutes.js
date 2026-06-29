const express = require('express');
const router = express.Router();
const si = require('systeminformation');
const mongoose = require('mongoose');

router.get('/health', async (req, res) => {
  try {
    const cpuData = await si.currentLoad();
    const memData = await si.mem();
    const diskData = await si.fsSize();
    const netData = await si.networkStats();

    const cpuPercent = Math.round(cpuData.currentLoad);
    const ramPercent = Math.round((memData.active / memData.total) * 100);

    // Average disk usage across all drives
    const diskPercent = diskData.length
      ? Math.round(diskData.reduce((sum, d) => sum + d.use, 0) / diskData.length)
      : 0;

    // Network: combine rx+tx speed (bytes/sec), convert to a rough % (capped at 100)
    const netSpeed = netData.length ? (netData[0].rx_sec + netData[0].tx_sec) : 0;
    const netPercent = Math.min(100, Math.round((netSpeed / 10000) * 10));

    const uptimeSeconds = process.uptime();
    const uptimeHours = Math.floor(uptimeSeconds / 3600);

    const dbStates = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];
    const dbStatus = dbStates[mongoose.connection.readyState] || 'Unknown';

    res.json({
      serverStatus: 'Online',
      dbStatus,
      cpuPercent,
      ramPercent,
      diskPercent,
      netPercent,
      uptimeHours,
      uptimeSeconds: Math.round(uptimeSeconds)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;