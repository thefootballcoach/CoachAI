/**
 * Systematic Parameter Validator
 * Ensures all parameters are correctly passed through the entire AI analysis pipeline
 */

import { validateParameter, systematicErrorTracker } from './systematic-error-tracker.js';

export interface ProcessingParameters {
  videoId: number;
  sessionType: string;
  playerAge: string;
  duration: number;
  transcript: string;
}

export function validateAndNormalizeParameters(
  videoId: number,
  video: any,
  transcript: string,
  duration?: number
): ProcessingParameters {
  console.log(`[VALIDATOR] Validating parameters for video ${videoId}`);
  
  // Normalize sessionType with fallback logic
  let sessionType = 'football coaching';
  if (video?.description) {
    const desc = video.description.toLowerCase();
    if (desc.includes('tactical')) sessionType = 'tactical coaching';
    else if (desc.includes('technical')) sessionType = 'technical coaching';
    else if (desc.includes('fitness')) sessionType = 'fitness coaching';
    else if (desc.includes('goalkeeping')) sessionType = 'goalkeeping coaching';
  }
  
  // Normalize playerAge with fallback logic
  let playerAge = 'youth';
  if (video?.ageGroup) {
    playerAge = video.ageGroup;
  } else if (video?.description) {
    const desc = video.description.toLowerCase();
    if (desc.includes('u21') || desc.includes('senior') || desc.includes('adult')) playerAge = 'adult';
    else if (desc.includes('u16') || desc.includes('u18')) playerAge = 'teenager';
    else if (desc.includes('u10') || desc.includes('u12')) playerAge = 'child';
  }
  
  // Normalize duration
  const normalizedDuration = duration || 30;
  
  // Validate transcript
  if (!transcript || transcript.length < 50) {
    console.warn(`[VALIDATOR] Warning: Short transcript (${transcript?.length || 0} characters)`);
  }
  
  const params: ProcessingParameters = {
    videoId,
    sessionType,
    playerAge,
    duration: normalizedDuration,
    transcript
  };
  
  console.log(`[VALIDATOR] Parameters validated:`, {
    videoId: params.videoId,
    sessionType: params.sessionType,
    playerAge: params.playerAge,
    duration: params.duration,
    transcriptLength: params.transcript.length
  });
  
  return params;
}

export function ensureParameterConsistency(params: ProcessingParameters, location: string = 'unknown'): ProcessingParameters {
  console.log(`[VALIDATOR] Ensuring parameter consistency at ${location}`);
  
  // Validate all parameters with systematic error tracking
  validateParameter('sessionType', params.sessionType, 'string', location);
  validateParameter('playerAge', params.playerAge, 'string', location);
  validateParameter('duration', params.duration, 'number', location);
  validateParameter('transcript', params.transcript, 'string', location);
  validateParameter('videoId', params.videoId, 'number', location);
  
  // Fix undefined parameters with logging
  if (!params.sessionType || params.sessionType === 'undefined') {
    params.sessionType = 'football coaching';
    console.log(`[VALIDATOR] Fixed undefined sessionType to: ${params.sessionType} at ${location}`);
    systematicErrorTracker.logParameterError(location, 'sessionType', 'undefined', 'string');
  }
  
  if (!params.playerAge || params.playerAge === 'undefined') {
    params.playerAge = 'youth';
    console.log(`[VALIDATOR] Fixed undefined playerAge to: ${params.playerAge} at ${location}`);
    systematicErrorTracker.logParameterError(location, 'playerAge', 'undefined', 'string');
  }
  
  if (!params.duration || params.duration <= 0) {
    params.duration = 30;
    console.log(`[VALIDATOR] Fixed invalid duration to: ${params.duration} at ${location}`);
    systematicErrorTracker.logParameterError(location, 'duration', params.duration, 'number');
  }
  
  if (!params.transcript) {
    systematicErrorTracker.logParameterError(location, 'transcript', 'missing', 'string');
    throw new Error(`Transcript is required for analysis at ${location}`);
  }
  
  console.log(`[VALIDATOR] Parameter consistency ensured at ${location}`);
  return params;
}