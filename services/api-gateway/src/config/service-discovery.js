/**
 * Service Discovery with Consul
 * Pattern: Service Registry and Discovery
 * Purpose: Dynamic service registration and discovery
 * 
 * Benefits:
 * - No hardcoded service URLs
 * - Automatic health checking
 * - Dynamic scaling support
 * - Self-healing architecture
 * 
 * How it works:
 * 1. Each service registers itself with Consul on startup
 * 2. Gateway queries Consul to discover service endpoints
 * 3. Consul performs health checks and removes unhealthy instances
 * 4. Gateway always routes to healthy instances only
 */

const Consul = require('consul');
const os = require('os');

class ServiceDiscovery {
  constructor() {
    this.consul = new Consul({
      host: process.env.CONSUL_HOST || 'consul',
      port: process.env.CONSUL_PORT || '8500',
      promisify: true,
    });

    this.serviceCache = new Map();
    this.cacheTimeout = 30000; // 30 seconds cache
  }

  /**
   * Register this service with Consul
   * Called on service startup
   */
  async registerService(serviceName, port) {
    const serviceId = `${serviceName}-${os.hostname()}-${port}`;
    
    const registration = {
      id: serviceId,
      name: serviceName,
      address: os.hostname(),
      port: parseInt(port),
      check: {
        http: `http://${os.hostname()}:${port}/health`,
        interval: '10s',
        timeout: '5s',
        deregisterCriticalServiceAfter: '1m',
      },
      tags: [
        `version:1.0.0`,
        `env:${process.env.NODE_ENV}`,
        `instance:${os.hostname()}`,
      ],
    };

    try {
      await this.consul.agent.service.register(registration);
      console.log(`✅ Service registered with Consul: ${serviceId}`);
      console.log(`🔍 Consul UI: http://localhost:8500/ui/dc1/services/${serviceName}`);

      // Deregister on shutdown
      process.on('SIGTERM', async () => {
        await this.deregisterService(serviceId);
      });

      return serviceId;
    } catch (error) {
      console.error(`❌ Failed to register service with Consul:`, error.message);
      // Don't fail startup if Consul is unavailable
      // Service will work with fallback URLs
    }
  }

  /**
   * Deregister service from Consul
   * Called on graceful shutdown
   */
  async deregisterService(serviceId) {
    try {
      await this.consul.agent.service.deregister(serviceId);
      console.log(`✅ Service deregistered from Consul: ${serviceId}`);
    } catch (error) {
      console.error(`❌ Failed to deregister service:`, error.message);
    }
  }

  /**
   * Discover a service by name
   * Returns a healthy instance URL
   * 
   * @param {string} serviceName - Name of service to discover
   * @returns {Promise<string>} - Service URL (http://host:port)
   */
  async discoverService(serviceName) {
    // Check cache first
    const cached = this.serviceCache.get(serviceName);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.url;
    }

    try {
      // Query Consul for healthy instances
      const services = await this.consul.health.service({
        service: serviceName,
        passing: true, // Only return healthy instances
      });

      if (!services || services.length === 0) {
        console.warn(`⚠️ No healthy instances found for ${serviceName}, using fallback`);
        return this.getFallbackUrl(serviceName);
      }

      // Load balance: pick random healthy instance
      const instance = services[Math.floor(Math.random() * services.length)];
      const url = `http://${instance.Service.Address}:${instance.Service.Port}`;

      // Cache the result
      this.serviceCache.set(serviceName, {
        url,
        timestamp: Date.now(),
      });

      console.log(`🔍 Discovered ${serviceName} at ${url}`);
      return url;

    } catch (error) {
      console.error(`❌ Service discovery failed for ${serviceName}:`, error.message);
      return this.getFallbackUrl(serviceName);
    }
  }

  /**
   * Fallback URLs if Consul is unavailable
   * Uses Docker internal DNS resolution
   */
  getFallbackUrl(serviceName) {
    const fallbacks = {
      'user-service': process.env.USER_SERVICE_URL || 'http://user-service:3000',
      'appointment-service': process.env.APPOINTMENT_SERVICE_URL || 'http://appointment-service:3000',
      'payment-service': process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3000',
      'inspection-service': process.env.INSPECTION_SERVICE_URL || 'http://inspection-service:3000',
      'certificate-service': process.env.CERTIFICATE_SERVICE_URL || 'http://certificate-service:3000',
      'notification-service': process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3000',
    };

    return fallbacks[serviceName] || `http://${serviceName}:3000`;
  }

  /**
   * Get all instances of a service (for load balancing)
   */
  async getAllInstances(serviceName) {
    try {
      const services = await this.consul.health.service({
        service: serviceName,
        passing: true,
      });

      return services.map(s => ({
        id: s.Service.ID,
        address: s.Service.Address,
        port: s.Service.Port,
        tags: s.Service.Tags,
        url: `http://${s.Service.Address}:${s.Service.Port}`,
      }));
    } catch (error) {
      console.error(`❌ Failed to get instances for ${serviceName}:`, error.message);
      return [];
    }
  }

  /**
   * Clear service cache
   * Useful when services are scaled or redeployed
   */
  clearCache() {
    this.serviceCache.clear();
    console.log('🔄 Service discovery cache cleared');
  }
}

// Singleton instance
const serviceDiscovery = new ServiceDiscovery();

module.exports = serviceDiscovery;
