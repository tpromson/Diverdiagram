/**
 * Service to interface with the Supabase Edge Function for securely parsing driver diagrams.
 */
import { supabaseUrl, supabasePublishableKey } from "../supabaseClient.js";

import { useAuthStore } from "../store/useAuthStore.js";

/**
 * Sends a PDF or image file to the Supabase Edge Function to extract a structured Driver Diagram.
 * 
 * @param {File} file The uploaded File object (image or PDF)
 * @returns {Promise<Object>} The parsed driver diagram object
 */
export const parseDiagramWithAI = async (file) => {
  if (!supabaseUrl) {
    throw new Error("SUPABASE_URL_MISSING");
  }

  // Supported MIME types for Deno Edge Function
  const mimeType = file.type;
  if (!mimeType || (!mimeType.startsWith("image/") && mimeType !== "application/pdf")) {
    throw new Error("INVALID_FILE_TYPE");
  }

  // Call the Supabase Edge Function proxy
  const url = `${supabaseUrl}/functions/v1/parse-driver-diagram`;
  const session = useAuthStore.getState().session;

  const headers = {
    "Content-Type": mimeType,
    "apikey": supabasePublishableKey,
  };

  // If user is logged in, send their access token.
  // Do NOT send the publishable key as Bearer token if logged out, as it is not a valid JWT and will cause Kong to fail with 401.
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: file // Send binary data directly in the request body
  });

  if (!response.ok) {
    let errorMessage = `Edge Function failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.error === "GEMINI_API_KEY_NOT_CONFIGURED") {
        throw new Error("API_KEY_MISSING");
      }
      errorMessage = errorData.error || errorMessage;
    } catch (e) {
      if (e.message === "API_KEY_MISSING") {
        throw e;
      }
      // If parsing JSON fails, keep the default status error message
    }
    throw new Error(errorMessage);
  }

  const result = await response.json();
  return result;
};
