import { apiRequest } from "./queryClient";
import { Video, Feedback, Progress } from "@shared/schema";

export async function uploadAudio(formData: FormData, onProgress?: (progress: number) => void): Promise<any> {
  try {
    // Starting audio upload with progress tracking
    
    // Log form data contents (except the actual file content)
    const formDataEntries = Array.from(formData.entries());
    let fileSize = 0;
    formDataEntries.forEach(([key, value]) => {
      if (key !== 'media' && key !== 'audio') {
        // Form data validation
      } else {
        const file = value as File;
        fileSize = file.size;
        // File validation: ${file.name}, ${(file.size / 1024 / 1024).toFixed(2)}MB
      }
    });
    
    // Track upload timing
    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Track real upload progress
      let lastProgressTime = startTime;
      let lastLoaded = 0;
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          // Calculate true percentage - avoid artificial limitations
          const percentComplete = Math.min(99, Math.round((event.loaded / event.total) * 100));
          const currentTime = Date.now();
          const timeDiff = currentTime - lastProgressTime;
          const bytesDiff = event.loaded - lastLoaded;
          
          // Calculate upload speed
          if (timeDiff > 1000) { // Only log every second
            const speedMBps = (bytesDiff / timeDiff / 1024).toFixed(2);
            const uploadedMB = (event.loaded / 1024 / 1024).toFixed(1);
            const totalMB = (event.total / 1024 / 1024).toFixed(1);
            // Upload progress: ${percentComplete}%
            lastProgressTime = currentTime;
            lastLoaded = event.loaded;
          }
          
          // Always update progress, even for small increments
          if (onProgress) {
            onProgress(percentComplete);
            
            // Log if progress seems stuck
            if (percentComplete === 30 || percentComplete === 99) {
              // Upload at critical point: ${percentComplete}%
            }
          }
        }
      });
      
      xhr.addEventListener('load', () => {
        const uploadTime = ((Date.now() - startTime) / 1000).toFixed(1);
        // Upload completed in ${uploadTime}s with status: ${xhr.status}
        
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            // Upload successful with video ID: ${response.id}
            if (onProgress) onProgress(100);
            resolve(response);
          } catch (e) {
            // Error parsing server response
            reject(new Error('Server processing error - please try again'));
          }
        } else {
          // Handle specific error codes
          if (xhr.status === 401) {
            reject(new Error('Session expired. Please log in again.'));
          } else if (xhr.status === 413) {
            reject(new Error('File too large. Maximum size is 6GB.'));
          } else if (xhr.status === 408) {
            reject(new Error('Upload timeout. Please check your internet connection.'));
          } else {
            let errorMessage = 'Upload failed';
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              errorMessage = errorResponse.message || errorResponse.error || errorMessage;
            } catch {}
            reject(new Error(errorMessage));
          }
        }
      });
      
      xhr.addEventListener('error', (event) => {
        // Network error occurred during upload
        // Network error details available for debugging
        
        // Check for common error scenarios
        if (xhr.status === 401) {
          reject(new Error('Session expired. Please log in again.'));
        } else if (xhr.status === 0) {
          reject(new Error('Network error: Connection failed or request blocked. Please check your connection and try again.'));
        } else {
          reject(new Error(`Network error: ${xhr.statusText || 'Request failed'} (Status: ${xhr.status})`));
        }
      });
      
      xhr.addEventListener('abort', () => {
        // Upload aborted
        reject(new Error('Upload aborted'));
      });
      
      // Configure for large uploads
      xhr.open('POST', '/api/audios/upload', true);
      xhr.withCredentials = true;
      
      // Set request headers
      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      
      // Add readyState change listener for debugging
      xhr.addEventListener('readystatechange', () => {
        // Upload state: ReadyState ${xhr.readyState}, Status ${xhr.status}
        if (xhr.readyState === 4) {
          // Request complete
        }
      });
      
      // Add event listeners for debugging
      xhr.addEventListener('loadstart', () => {
        // Upload started
      });
      
      xhr.addEventListener('timeout', () => {
        // Upload timeout occurred
        reject(new Error('Upload timeout: File upload took too long'));
      });
      
      // Disable timeout for very large files
      xhr.timeout = 0;
      
      // Send the request
      try {
        xhr.send(formData);
        // FormData sent to server
      } catch (sendError) {
        // Error sending FormData
        reject(new Error('Failed to send upload request'));
      }
    });
  } catch (error: any) {
    // Error uploading audio
    throw new Error(`Failed to upload audio: ${error.message}`);
  }
}

export async function getAudios(): Promise<Video[]> {
  try {
    const res = await apiRequest("GET", "/api/audios");
    const data = await res.json();
    // GetAudios response processed
    return data;
  } catch (error: any) {
    // Error getting audios
    // Handle session expiration gracefully
    if (error.message?.includes('401')) {
      throw new Error('Session expired. Please log in again.');
    }
    throw new Error(`Failed to get audios: ${error.message}`);
  }
}

export async function getAudio(id: number): Promise<Video> {
  try {
    const res = await apiRequest("GET", `/api/audios/${id}`);
    return await res.json();
  } catch (error: any) {
    // Error getting audio with id
    throw new Error(`Failed to get audio: ${error.message}`);
  }
}

export async function getFeedbacks(): Promise<Feedback[]> {
  try {
    const res = await apiRequest("GET", "/api/feedbacks");
    return await res.json();
  } catch (error: any) {
    // Error getting feedbacks
    throw new Error(`Failed to get feedbacks: ${error.message}`);
  }
}

export async function getFeedbackByAudioId(audioId: number): Promise<Feedback> {
  try {
    const res = await apiRequest("GET", `/api/audios/${audioId}/feedback`);
    return await res.json();
  } catch (error: any) {
    // Error getting feedback for audio
    throw new Error(`Failed to get feedback: ${error.message}`);
  }
}

export async function getUserProgress(): Promise<Progress> {
  try {
    const res = await apiRequest("GET", "/api/progress");
    return await res.json();
  } catch (error: any) {
    // Error getting user progress
    throw new Error(`Failed to get user progress: ${error.message}`);
  }
}

export async function analyzeAudio(videoId: number): Promise<{ success: boolean, message: string }> {
  try {
    const res = await apiRequest("POST", `/api/audios/${videoId}/analyze`);
    return await res.json();
  } catch (error: any) {
    // Error analyzing audio
    throw new Error(`Failed to analyze audio: ${error.message}`);
  }
}
