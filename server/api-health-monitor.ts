/**
 * API Health Monitor with Circuit Breaker Pattern
 * Prevents repeated attempts when API is consistently failing
 */

interface HealthStatus {
  isHealthy: boolean;
  lastCheck: Date;
  failureCount: number;
  lastFailure?: Date;
  circuitBreakerOpen: boolean;
  nextRetryTime?: Date;
}

class ApiHealthMonitor {
  private status: HealthStatus = {
    isHealthy: true,
    lastCheck: new Date(),
    failureCount: 0,
    circuitBreakerOpen: false,
  };

  private readonly MAX_FAILURES = 3;
  private readonly CIRCUIT_BREAKER_TIMEOUT = 5 * 60 * 1000; // 5 minutes
  private readonly HEALTH_CHECK_INTERVAL = 30 * 1000; // 30 seconds

  recordSuccess() {
    this.status.isHealthy = true;
    this.status.failureCount = 0;
    this.status.circuitBreakerOpen = false;
    this.status.lastCheck = new Date();
    this.status.nextRetryTime = undefined;
    console.log('API Health Monitor: API is healthy');
  }

  recordFailure(error: string) {
    this.status.failureCount++;
    this.status.lastFailure = new Date();
    this.status.lastCheck = new Date();

    if (this.status.failureCount >= this.MAX_FAILURES) {
      this.status.circuitBreakerOpen = true;
      this.status.isHealthy = false;
      this.status.nextRetryTime = new Date(Date.now() + this.CIRCUIT_BREAKER_TIMEOUT);
      
      console.log(`API Health Monitor: Circuit breaker opened after ${this.status.failureCount} failures. Next retry at ${this.status.nextRetryTime.toLocaleTimeString()}`);
    } else {
      console.log(`API Health Monitor: Recorded failure ${this.status.failureCount}/${this.MAX_FAILURES}: ${error}`);
    }
  }

  canMakeRequest(): boolean {
    // If circuit breaker is open, check if timeout has passed
    if (this.status.circuitBreakerOpen) {
      if (this.status.nextRetryTime && new Date() > this.status.nextRetryTime) {
        console.log('API Health Monitor: Circuit breaker timeout expired, allowing retry');
        this.status.circuitBreakerOpen = false;
        this.status.failureCount = 0;
        return true;
      }
      return false;
    }

    return true;
  }

  getStatus(): HealthStatus {
    return { ...this.status };
  }

  getHealthSummary(): string {
    if (this.status.circuitBreakerOpen) {
      const waitTime = this.status.nextRetryTime 
        ? Math.ceil((this.status.nextRetryTime.getTime() - Date.now()) / 1000)
        : 0;
      return `Circuit breaker open - retry in ${waitTime} seconds`;
    }

    if (this.status.failureCount > 0) {
      return `${this.status.failureCount}/${this.MAX_FAILURES} failures recorded`;
    }

    return 'API healthy';
  }
}

export const apiHealthMonitor = new ApiHealthMonitor();