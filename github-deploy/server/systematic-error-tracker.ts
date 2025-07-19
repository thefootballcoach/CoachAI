/**
 * Systematic Error Tracker
 * Identifies and logs systematic issues that cause component failures
 */

interface SystematicError {
  errorType: 'parameter_undefined' | 'data_structure_mismatch' | 'function_missing' | 'timeout' | 'api_failure';
  location: string;
  parameters: any;
  timestamp: Date;
  stackTrace?: string;
  expectedStructure?: any;
  actualStructure?: any;
}

class SystematicErrorTracker {
  private errors: SystematicError[] = [];
  
  logParameterError(location: string, parameterName: string, value: any, expectedType: string) {
    const error: SystematicError = {
      errorType: 'parameter_undefined',
      location,
      parameters: { [parameterName]: value, expectedType },
      timestamp: new Date(),
      stackTrace: new Error().stack
    };
    
    this.errors.push(error);
    console.error(`[SYSTEMATIC ERROR] Parameter undefined: ${parameterName} at ${location}`, {
      value,
      expectedType,
      timestamp: error.timestamp
    });
  }
  
  logStructureMismatch(location: string, expected: any, actual: any) {
    const error: SystematicError = {
      errorType: 'data_structure_mismatch',
      location,
      parameters: {},
      timestamp: new Date(),
      expectedStructure: expected,
      actualStructure: actual,
      stackTrace: new Error().stack
    };
    
    this.errors.push(error);
    console.error(`[SYSTEMATIC ERROR] Data structure mismatch at ${location}`, {
      expected,
      actual,
      timestamp: error.timestamp
    });
  }
  
  logFunctionMissing(location: string, functionName: string) {
    const error: SystematicError = {
      errorType: 'function_missing',
      location,
      parameters: { functionName },
      timestamp: new Date(),
      stackTrace: new Error().stack
    };
    
    this.errors.push(error);
    console.error(`[SYSTEMATIC ERROR] Function missing: ${functionName} at ${location}`, {
      timestamp: error.timestamp
    });
  }
  
  getErrorSummary() {
    const summary = {
      totalErrors: this.errors.length,
      errorsByType: {} as any,
      errorsByLocation: {} as any,
      recentErrors: this.errors.slice(-10)
    };
    
    this.errors.forEach(error => {
      summary.errorsByType[error.errorType] = (summary.errorsByType[error.errorType] || 0) + 1;
      summary.errorsByLocation[error.location] = (summary.errorsByLocation[error.location] || 0) + 1;
    });
    
    return summary;
  }
  
  identifySystematicPatterns() {
    const patterns = [];
    
    // Check for repeated parameter undefined errors
    const parameterErrors = this.errors.filter(e => e.errorType === 'parameter_undefined');
    if (parameterErrors.length > 3) {
      patterns.push('CRITICAL: Repeated parameter passing failures - systematic parameter validation needed');
    }
    
    // Check for repeated structure mismatches
    const structureErrors = this.errors.filter(e => e.errorType === 'data_structure_mismatch');
    if (structureErrors.length > 2) {
      patterns.push('CRITICAL: Data structure inconsistencies - systematic interface standardization needed');
    }
    
    // Check for location-specific clustering
    const locationCounts = this.getErrorSummary().errorsByLocation;
    Object.entries(locationCounts).forEach(([location, count]) => {
      if ((count as number) > 2) {
        patterns.push(`HIGH: Repeated failures in ${location} - needs systematic review`);
      }
    });
    
    return patterns;
  }
}

export const systematicErrorTracker = new SystematicErrorTracker();

// Helper function to validate parameters with automatic error tracking
export function validateParameter(paramName: string, value: any, expectedType: string, location: string): boolean {
  if (value === undefined || value === null || value === 'undefined') {
    systematicErrorTracker.logParameterError(location, paramName, value, expectedType);
    return false;
  }
  
  if (expectedType === 'string' && typeof value !== 'string') {
    systematicErrorTracker.logParameterError(location, paramName, value, expectedType);
    return false;
  }
  
  if (expectedType === 'number' && typeof value !== 'number') {
    systematicErrorTracker.logParameterError(location, paramName, value, expectedType);
    return false;
  }
  
  return true;
}

// Helper function to validate data structure
export function validateDataStructure(location: string, data: any, requiredFields: string[]): boolean {
  if (!data) {
    systematicErrorTracker.logStructureMismatch(location, { requiredFields }, null);
    return false;
  }
  
  const missingFields = requiredFields.filter(field => !(field in data));
  if (missingFields.length > 0) {
    systematicErrorTracker.logStructureMismatch(location, { requiredFields }, { missingFields, availableFields: Object.keys(data) });
    return false;
  }
  
  return true;
}