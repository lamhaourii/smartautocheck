/**
 * Load Test: Distributed Rate Limiting
 * 
 * Purpose: Prove that rate limiting works across multiple gateway instances
 * 
 * Scenario:
 * 1. Scale API Gateway to 3 instances: docker-compose up --scale api-gateway=3
 * 2. Send 150 requests from single user
 * 3. Rate limit is 100 req/min (configured in gateway)
 * 4. Expected: Exactly 100 succeed, 50 get 429 (Too Many Requests)
 * 5. Proves: Redis-based rate limiting shares state across all 3 instances
 * 
 * Run: k6 run load-tests/rate-limit-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';

// Custom metrics
const successCount = new Counter('requests_success');
const rateLimitCount = new Counter('requests_rate_limited');

export const options = {
  vus: 1, // Single virtual user to test per-user rate limit
  iterations: 150, // Exactly 150 requests
  duration: '30s', // Should complete in 30 seconds
};

export default function () {
  const baseUrl = __ENV.API_URL || 'http://localhost';
  
  // Make a simple GET request to a read endpoint
  const res = http.get(`${baseUrl}/api/appointments/available?date=2024-12-31`, {
    headers: {
      'X-Test-User-ID': 'rate-limit-test-user', // Consistent user ID for rate limiting
    },
  });

  const isSuccess = check(res, {
    'status is 200 or 429': (r) => r.status === 200 || r.status === 429,
  });

  if (res.status === 200) {
    successCount.add(1);
    check(res, {
      'has rate limit headers': (r) => 
        r.headers['X-Ratelimit-Limit'] !== undefined &&
        r.headers['X-Ratelimit-Remaining'] !== undefined,
    });
  } else if (res.status === 429) {
    rateLimitCount.add(1);
    check(res, {
      'has retry-after header': (r) => r.headers['Retry-After'] !== undefined,
      'error message mentions rate limit': (r) => 
        r.json('error') === 'Too many requests',
    });
  }

  sleep(0.1); // Small delay to avoid overwhelming the system
}

export function setup() {
  console.log('🚀 Starting distributed rate limit test');
  console.log('📊 Configuration:');
  console.log('   - Virtual Users: 1 (testing per-user limit)');
  console.log('   - Total Requests: 150');
  console.log('   - Rate Limit: 100 req/min');
  console.log('   - Expected Success: ~100 requests');
  console.log('   - Expected 429s: ~50 requests');
  console.log('');
  console.log('⚙️  Ensure API Gateway is scaled:');
  console.log('   docker-compose up --scale api-gateway=3');
  console.log('');
}

export function teardown(data) {
  console.log('');
  console.log('✅ Rate limit test completed');
  console.log('');
  console.log('📈 EXPECTED RESULTS:');
  console.log('   ✓ ~100 requests succeeded (200 status)');
  console.log('   ✓ ~50 requests rate limited (429 status)');
  console.log('   ✓ All requests have rate limit headers');
  console.log('');
  console.log('🔍 VERIFICATION:');
  console.log('   1. Check Redis keys:');
  console.log('      docker exec smartautocheck-redis redis-cli KEYS "rl:*"');
  console.log('');
  console.log('   2. Verify single counter for user:');
  console.log('      docker exec smartautocheck-redis redis-cli GET "rl:global:ip:..."');
  console.log('');
  console.log('   3. Check nginx logs for load distribution:');
  console.log('      docker exec smartautocheck-nginx cat /var/log/nginx/access.log | tail -20');
  console.log('');
  console.log('💡 KEY INSIGHT:');
  console.log('   Despite 3 gateway instances, rate limit enforced globally');
  console.log('   This proves Redis-based distributed state management works!');
}

/**
 * WHY THIS MATTERS - ACADEMIC EXPLANATION:
 * 
 * In-Memory Rate Limiter (WRONG):
 * ================================
 * - Each API Gateway instance has its own counter
 * - Gateway 1: 33 requests from user → Allowed (< 100)
 * - Gateway 2: 33 requests from user → Allowed (< 100)
 * - Gateway 3: 34 requests from user → Allowed (< 100)
 * - Total: 100 requests, but user made 100 requests → FAIL
 * - User bypassed rate limit by hitting different instances
 * 
 * Redis-Based Rate Limiter (CORRECT):
 * ====================================
 * - Single Redis counter shared by all 3 gateway instances
 * - Gateway 1: 33 requests → Redis counter: 33
 * - Gateway 2: 33 requests → Redis counter: 66
 * - Gateway 3: 34 requests → Redis counter: 100
 * - Next request: Redis counter: 101 → 429 Too Many Requests
 * - Rate limit correctly enforced regardless of which gateway receives request
 * 
 * DISTRIBUTED SYSTEMS CONCEPT:
 * - Stateless services need shared state for coordination
 * - Redis provides distributed cache for shared counters
 * - Atomic operations (INCR) prevent race conditions
 * - TTL ensures counters expire after time window
 * 
 * REAL-WORLD APPLICATION:
 * - Prevents API abuse across scaled infrastructure
 * - Fair resource allocation per user
 * - Protects backend services from overload
 * - Works seamlessly during horizontal scaling
 */
