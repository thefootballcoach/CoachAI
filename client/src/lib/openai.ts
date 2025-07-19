import { apiRequest } from "./queryClient";

// API functions that interface with our backend OpenAI services

export async function analyzeVideo(videoId: number): Promise<any> {
  try {
    const res = await apiRequest("POST", `/api/videos/${videoId}/analyze`, {});
    return await res.json();
  } catch (error: any) {
    console.error("Error analyzing video:", error);
    throw new Error(`Failed to analyze video: ${error.message}`);
  }
}

export async function getFeedback(videoId: number): Promise<any> {
  try {
    const res = await apiRequest("GET", `/api/videos/${videoId}/feedback`);
    return await res.json();
  } catch (error: any) {
    console.error("Error getting feedback:", error);
    throw new Error(`Failed to get feedback: ${error.message}`);
  }
}

export async function getVideoStatus(videoId: number): Promise<any> {
  try {
    const res = await apiRequest("GET", `/api/videos/${videoId}/status`);
    return await res.json();
  } catch (error: any) {
    console.error("Error getting video status:", error);
    throw new Error(`Failed to get video status: ${error.message}`);
  }
}
