/**
 * BIZPOS Server Discovery Service
 * Uses UDP broadcast to discover POS servers on the local network
 */

const dgram = require('dgram');
const os = require('os');

const DISCOVERY_PORT = 41234;
const BROADCAST_INTERVAL = 3000; // 3 seconds
const DISCOVERY_TIMEOUT = 10000; // 10 seconds to listen for servers

class DiscoveryService {
  constructor() {
    this.serverSocket = null;
    this.clientSocket = null;
    this.broadcastInterval = null;
    this.discoveredServers = new Map();
    this.isServer = false;
    this.serverInfo = null;
  }

  /**
   * Get all local IP addresses
   */
  getLocalIPs() {
    const interfaces = os.networkInterfaces();
    const addresses = [];
    
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          addresses.push({
            address: iface.address,
            netmask: iface.netmask,
            broadcast: this.calculateBroadcast(iface.address, iface.netmask),
          });
        }
      }
    }
    return addresses;
  }

  /**
   * Calculate broadcast address from IP and netmask
   */
  calculateBroadcast(ip, netmask) {
    const ipParts = ip.split('.').map(Number);
    const maskParts = netmask.split('.').map(Number);
    const broadcastParts = ipParts.map((part, i) => part | (~maskParts[i] & 255));
    return broadcastParts.join('.');
  }

  /**
   * Start broadcasting as a server
   */
  startServer(serverInfo) {
    this.isServer = true;
    this.serverInfo = {
      id: serverInfo.id || `server-${Date.now()}`,
      name: serverInfo.name || 'BIZPOS Server',
      port: serverInfo.port || 3001,
      version: serverInfo.version || '1.0.0',
      ips: this.getLocalIPs().map(i => i.address),
      startedAt: new Date().toISOString(),
    };

    this.serverSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    
    this.serverSocket.on('error', (err) => {
      console.error('Discovery server error:', err);
    });

    this.serverSocket.on('listening', () => {
      this.serverSocket.setBroadcast(true);
      console.log('Discovery service started - broadcasting server presence');
      this.startBroadcasting();
    });

    this.serverSocket.bind(0); // Bind to any available port for sending
  }

  /**
   * Start periodic broadcasting
   */
  startBroadcasting() {
    const broadcast = () => {
      const message = JSON.stringify({
        type: 'BIZPOS_SERVER_ANNOUNCE',
        ...this.serverInfo,
        timestamp: Date.now(),
      });

      const localIPs = this.getLocalIPs();
      
      localIPs.forEach(({ broadcast }) => {
        if (broadcast && this.serverSocket) {
          this.serverSocket.send(message, 0, message.length, DISCOVERY_PORT, broadcast, (err) => {
            if (err) {
              console.error('Broadcast error:', err);
            }
          });
        }
      });
    };

    // Broadcast immediately and then periodically
    broadcast();
    this.broadcastInterval = setInterval(broadcast, BROADCAST_INTERVAL);
  }

  /**
   * Stop broadcasting
   */
  stopServer() {
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
      this.broadcastInterval = null;
    }
    if (this.serverSocket) {
      this.serverSocket.close();
      this.serverSocket = null;
    }
    this.isServer = false;
  }

  /**
   * Start listening for servers (client mode)
   */
  discoverServers(timeout = DISCOVERY_TIMEOUT) {
    return new Promise((resolve) => {
      this.discoveredServers.clear();
      
      this.clientSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
      
      this.clientSocket.on('error', (err) => {
        console.error('Discovery client error:', err);
        resolve([]);
      });

      this.clientSocket.on('message', (msg, rinfo) => {
        try {
          const data = JSON.parse(msg.toString());
          
          if (data.type === 'BIZPOS_SERVER_ANNOUNCE') {
            const serverId = data.id;
            const serverEntry = {
              id: serverId,
              name: data.name,
              port: data.port,
              version: data.version,
              ips: data.ips,
              sourceIp: rinfo.address,
              lastSeen: Date.now(),
              startedAt: data.startedAt,
            };
            
            this.discoveredServers.set(serverId, serverEntry);
            console.log(`Discovered server: ${data.name} at ${rinfo.address}:${data.port}`);
          }
        } catch (error) {
          // Ignore invalid messages
        }
      });

      this.clientSocket.on('listening', () => {
        console.log('Listening for BIZPOS servers...');
      });

      this.clientSocket.bind(DISCOVERY_PORT, '0.0.0.0');

      // Wait for timeout, then return discovered servers
      setTimeout(() => {
        this.stopDiscovery();
        const servers = Array.from(this.discoveredServers.values());
        resolve(servers);
      }, timeout);
    });
  }

  /**
   * Keep listening for servers (continuous discovery)
   */
  startContinuousDiscovery(onServerFound, onServerLost) {
    this.discoveredServers.clear();
    
    this.clientSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    
    this.clientSocket.on('error', (err) => {
      console.error('Discovery client error:', err);
    });

    this.clientSocket.on('message', (msg, rinfo) => {
      try {
        const data = JSON.parse(msg.toString());
        
        if (data.type === 'BIZPOS_SERVER_ANNOUNCE') {
          const serverId = data.id;
          const isNew = !this.discoveredServers.has(serverId);
          
          const serverEntry = {
            id: serverId,
            name: data.name,
            port: data.port,
            version: data.version,
            ips: data.ips,
            sourceIp: rinfo.address,
            lastSeen: Date.now(),
            startedAt: data.startedAt,
          };
          
          this.discoveredServers.set(serverId, serverEntry);
          
          if (isNew && onServerFound) {
            onServerFound(serverEntry);
          }
        }
      } catch (error) {
        // Ignore invalid messages
      }
    });

    this.clientSocket.bind(DISCOVERY_PORT, '0.0.0.0');

    // Check for lost servers every 10 seconds
    this.lostServerCheck = setInterval(() => {
      const now = Date.now();
      for (const [serverId, server] of this.discoveredServers) {
        if (now - server.lastSeen > BROADCAST_INTERVAL * 3) {
          this.discoveredServers.delete(serverId);
          if (onServerLost) {
            onServerLost(server);
          }
        }
      }
    }, 10000);
  }

  /**
   * Stop discovery
   */
  stopDiscovery() {
    if (this.clientSocket) {
      this.clientSocket.close();
      this.clientSocket = null;
    }
    if (this.lostServerCheck) {
      clearInterval(this.lostServerCheck);
      this.lostServerCheck = null;
    }
  }

  /**
   * Get currently discovered servers
   */
  getDiscoveredServers() {
    return Array.from(this.discoveredServers.values());
  }
}

module.exports = { DiscoveryService, DISCOVERY_PORT };
