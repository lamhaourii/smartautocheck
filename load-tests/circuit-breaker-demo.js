/**
 * Load Test: Circuit Breaker Pattern Demonstration
 * 
 * Purpose: Demonstrate circuit breaker preventing cascading failures
 * 
 * Scenario:
 * 1. Phase 1: Normal operation (circuit CLOSED)
 * 2. Phase 2: Simulate service failure (stop payment-service)
 * 3. Phase 3: Circuit opens, requests fail fast with fallback
 * 4. Phase 4: Restart service, circuit auto-recovers (HALF-OPEN → CLOSED)
 * 
 * Run:
 * 1. Start test: k6 run load-tests/circuit-breaker-demo.js
 * 2. During test: docker-compose stop payment-service
 * 3. After 30s: docker-compose start payment-service
 * 4. Observe: Circuit opens → fallback → auto-recovery
 * 
 * Expected Results:
 * - Phase 1: 100% success, avg latency ~100ms
 * - Phase 2 (service down): 100% fallback, avg latency ~10ms (fail fast!)
 * - Phase 3 (recovery): Circuit closes, success rate improves
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend, Rate } from 'k6/metrics';

// Custom metrics
const successCount = new Counter('payment_success');
const fallbackCount = new Counter('payment_fallback');
const errorCount = new Counter('payment_error');
const responseTime = new Trend('payment_response_time');
const fallbackRate = new Rate('fallback_triggered');

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Phase 1: Normal operation
    { duration: '1m', target: 20 },    // Phase 2: Service failure (manual stop)
    { duration: '30s', target: 10 },   // Phase 3: Recovery (manual start)
  ],
  thresholds: {
    'payment_response_time': ['p(95)<500'], // Fast responses even during failure
  },
};

export default function () {
  const baseUrl = __ENV.API_URL || 'http://localhost';
  const startTime = Date.now();
  
  // Attempt to create payment order
  const res = http.post(
    `${baseUrl}/api/payments/create-order`,
    JSON.stringify({
      amount: 50,
      currency: 'USD',
    }),
    {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: '15s', // Allow time for timeout if service down
    }
  );

  const duration = Date.now() - startTime;
  responseTime.add(duration);

  // Analyze response
  if (res.status === 200) {
    // Normal success
    successCount.add(1);
    fallbackRate.add(0);
    
    check(res, {
      'payment order created': (r) => r.json('data.orderId') !== undefined,
      'response time acceptable': () => duration < 1000,
    });
    
    console.log(`✅ Success - Response time: ${duration}ms`);
    
  } else if (res.status === 503 || res.body.includes('temporarily unavailable')) {
    // Circuit breaker fallback
    fallbackCount.add(1);
    fallbackRate.add(1);
    
    check(res, {
      'fallback message present': (r) => 
        r.json('error') === 'Payment service temporarily unavailable' ||
        r.json('message') !== undefined,
      'fast failure': () => duration < 100, // Should fail in <100ms
    });
    
    console.log(`⚠️  Fallback - Response time: ${duration}ms (circuit likely OPEN)`);
    
  } else {
    // Unexpected error
    errorCount.add(1);
    fallbackRate.add(0);
    console.log(`❌ Error - Status: ${res.status}, Response time: ${duration}ms`);
  }

  sleep(1);
}

export function setup() {
  console.log('🚀 Starting Circuit Breaker Demo');
  console.log('');
  console.log('📋 TEST PHASES:');
  console.log('');
  console.log('Phase 1: Normal Operation (0-30s)');
  console.log('   ✓ Payment service is running');
  console.log('   ✓ Circuit is CLOSED');
  console.log('   ✓ All requests should succeed');
  console.log('   ✓ Response time: ~100ms');
  console.log('');
  console.log('Phase 2: Service Failure (30s-90s)');
  console.log('   🛑 MANUAL ACTION: Run this command in another terminal:');
  console.log('      docker-compose stop payment-service');
  console.log('   ✓ Circuit should OPEN after ~10-20 failed requests');
  console.log('   ✓ Requests fail fast with fallback');
  console.log('   ✓ Response time: ~10ms (no timeout wait!)');
  console.log('');
  console.log('Phase 3: Service Recovery (90s-120s)');
  console.log('   ▶️  MANUAL ACTION: Run this command in another terminal:');
  console.log('      docker-compose start payment-service');
  console.log('   ✓ Circuit goes HALF-OPEN (testing recovery)');
  console.log('   ✓ After successful test request, circuit CLOSES');
  console.log('   ✓ Normal operation resumes');
  console.log('');
  console.log('📊 METRICS TO WATCH:');
  console.log('   - payment_response_time: Should stay low even during failure');
  console.log('   - fallback_triggered: Rate increases when circuit opens');
  console.log('');
  console.log('🔍 MONITORING:');
  console.log('   - Circuit status: curl http://localhost/admin/circuit-breakers');
  console.log('   - Jaeger traces: http://localhost:16686');
  console.log('');
}

export function teardown(data) {
  console.log('');
  console.log('='.repeat(70));
  console.log('✅ Circuit Breaker Demo Completed');
  console.log('='.repeat(70));
  console.log('');
  console.log('📈 EXPECTED OBSERVATIONS:');
  console.log('');
  console.log('1. NORMAL OPERATION (Circuit CLOSED):');
  console.log('   ✓ Requests succeed with ~100ms latency');
  console.log('   ✓ Circuit breaker state: CLOSED');
  console.log('   ✓ No fallbacks triggered');
  console.log('');
  console.log('2. SERVICE FAILURE (Circuit OPEN):');
  console.log('   ✓ After ~50% error rate, circuit opens');
  console.log('   ✓ Response time drops to ~10ms (fail fast!)');
  console.log('   ✓ All requests return fallback response');
  console.log('   ✓ No more timeouts waiting for dead service');
  console.log('');
  console.log('3. SERVICE RECOVERY (Circuit HALF-OPEN → CLOSED):');
  console.log('   ✓ Circuit allows test request after 30s');
  console.log('   ✓ If successful, circuit closes');
  console.log('   ✓ Normal operation resumes');
  console.log('   ✓ Self-healing without manual intervention!');
  console.log('');
  console.log('💡 KEY BENEFITS DEMONSTRATED:');
  console.log('');
  console.log('1. Fail Fast:');
  console.log('   Instead of waiting 10s for timeout, fail in 10ms');
  console.log('   Prevents thread/resource exhaustion in gateway');
  console.log('');
  console.log('2. Graceful Degradation:');
  console.log('   User gets informative error message immediately');
  console.log('   Better UX than hanging request');
  console.log('');
  console.log('3. Self-Healing:');
  console.log('   Circuit automatically tests recovery');
  console.log('   No manual intervention needed');
  console.log('');
  console.log('4. Prevent Cascade:');
  console.log('   Gateway remains healthy even when downstream fails');
  console.log('   Failure isolated to payment service only');
  console.log('');
  console.log('🎓 ACADEMIC SIGNIFICANCE:');
  console.log('');
  console.log('This demonstrates understanding of:');
  console.log('   • Distributed systems failure modes');
  console.log('   • Resilience patterns (Circuit Breaker)');
  console.log('   • Fault tolerance and availability trade-offs');
  console.log('   • Practical implementation of Netflix Hystrix concepts');
  console.log('');
  console.log('🔍 VERIFY RESULTS:');
  console.log('   1. Check circuit status:');
  console.log('      curl http://localhost/admin/circuit-breakers');
  console.log('');
  console.log('   2. View in Jaeger:');
  console.log('      - Compare request traces before/during/after failure');
  console.log('      - See fallback responses in trace details');
  console.log('      - Notice reduced latency when circuit open');
  console.log('');
  console.log('='.repeat(70));
}

/**
 * CIRCUIT BREAKER STATE MACHINE:
 * 
 * CLOSED (Normal):
 * ├─ Requests pass through to service
 * ├─ Monitor success/failure rate
 * └─ If failure rate > 50%: → OPEN
 * 
 * OPEN (Failing):
 * ├─ Reject all requests immediately
 * ├─ Return fallback response
 * ├─ No calls to downstream service
 * └─ After 30s timeout: → HALF-OPEN
 * 
 * HALF-OPEN (Testing):
 * ├─ Allow single test request
 * ├─ If successful: → CLOSED (recovery!)
 * └─ If fails: → OPEN (retry later)
 * 
 * ACADEMIC CONCEPTS:
 * 
 * 1. Failure Detection:
 *    - Monitor error rate in rolling time window
 *    - Threshold: 50% error rate over 10 requests
 *    - Prevents false positives from single failures
 * 
 * 2. Fail Fast:
 *    - When open, return error in <10ms
 *    - Compare to 10s timeout if no circuit breaker
 *    - 1000x faster failure response!
 * 
 * 3. Self-Healing:
 *    - Automatic recovery testing
 *    - Exponential backoff: 30s → 60s → 120s
 *    - No manual intervention required
 * 
 * 4. Resource Protection:
 *    - Prevents thread pool exhaustion
 *    - Protects gateway from cascading failure
 *    - Maintains availability for other services
 */
