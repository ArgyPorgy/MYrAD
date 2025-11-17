import fetch from "node-fetch";
import FormData from "form-data";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

// Get all API keys from environment
const VT_API_KEYS = [
  process.env.VT_API_KEY_1,
  process.env.VT_API_KEY_2,
  process.env.VT_API_KEY_3
].filter(key => key && key.trim()); // Remove empty keys

// Fallback to old VT_API_KEY if new keys not set
if (VT_API_KEYS.length === 0 && process.env.VT_API_KEY) {
  VT_API_KEYS.push(process.env.VT_API_KEY);
}

// Log API key configuration (without exposing keys)
if (VT_API_KEYS.length > 0) {
  console.log(`[VT API] Configured ${VT_API_KEYS.length} VirusTotal API key(s) for fallback`);
} else {
  console.warn('[VT API] ⚠️  No VirusTotal API keys configured!');
}

const MAX_POLL_ATTEMPTS = 90; // 90 attempts = 90 seconds max wait time (90 × 1 second)
const POLL_INTERVAL_MS = 1000; // 1 second between polls (faster detection)

// Helper function to try API call with multiple keys (fallback mechanism)
async function tryWithApiKeys(apiCall, operationName = 'API call') {
  if (VT_API_KEYS.length === 0) {
    throw new Error('No VirusTotal API keys configured');
  }

  let lastError = null;

  for (let i = 0; i < VT_API_KEYS.length; i++) {
    const apiKey = VT_API_KEYS[i];
    try {
      const result = await apiCall(apiKey);
      
      // Check for rate limit (429) - try next key
      if (result && result.status === 429) {
        lastError = new Error(`Rate limit hit on API key ${i + 1}`);
        if (i < VT_API_KEYS.length - 1) {
          console.log(`[VT API] Rate limit on key ${i + 1}, trying next key...`);
          continue; // Try next key silently
        }
        // Last key, return the error result
        throw lastError;
      }
      
      // Check for 403 Forbidden (might also be rate limit related)
      if (result && result.status === 403) {
        lastError = new Error(`Forbidden (403) on API key ${i + 1} - possibly rate limited`);
        if (i < VT_API_KEYS.length - 1) {
          console.log(`[VT API] 403 error on key ${i + 1}, trying next key...`);
          continue;
        }
        throw lastError;
      }
      
      // Success or other non-rate-limit status - return immediately
      if (i > 0) {
        console.log(`[VT API] ${operationName} succeeded with API key ${i + 1} (after ${i} failed attempt(s))`);
      }
      return result;
      
    } catch (err) {
      lastError = err;
      
      // Check if it's a rate limit error in the error message
      const isRateLimit = err.message && (
        err.message.includes('429') || 
        err.message.includes('rate limit') || 
        err.message.includes('Rate limit') ||
        err.message.includes('Too Many Requests')
      );
      
      if (isRateLimit && i < VT_API_KEYS.length - 1) {
        console.log(`[VT API] Rate limit error on key ${i + 1}, trying next key...`);
        continue; // Try next key silently
      }
      
      // For other errors or if it's the last key, throw it
      if (i === VT_API_KEYS.length - 1) {
        throw err;
      }
      
      // Otherwise, try next key (for non-fatal errors)
      console.log(`[VT API] Error on key ${i + 1} (${err.message}), trying next key...`);
    }
  }

  // All keys failed
  if (lastError) {
    throw lastError;
  }
  
  throw new Error(`All ${VT_API_KEYS.length} API keys failed for ${operationName}`);
}

// Calculate SHA-256 hash of file buffer
function calculateFileHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// Check if file has been scanned before by hash (faster than uploading)
export async function getFileReport(fileHash) {
  try {
    const result = await tryWithApiKeys(async (apiKey) => {
      const response = await fetch(`https://www.virustotal.com/api/v3/files/${fileHash}`, {
        method: "GET",
        headers: { "x-apikey": apiKey }
      });

      if (response.status === 404) {
        return { status: 404, data: null }; // File not found, needs to be uploaded
      }

      if (response.status === 429) {
        return { status: 429, error: 'Rate limit' };
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`VirusTotal API error: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`);
      }

      return { status: response.status, data: await response.json() };
    }, 'getFileReport');

    if (result.status === 404) {
      return null; // File not found, needs to be uploaded
    }

    return result.data;
  } catch (err) {
    console.error("Error getting file report:", err);
    return null;
  }
}

export async function scanFileWithVirusTotal(buffer, fileName) {
  const form = new FormData();
  form.append("file", buffer, fileName);

  const result = await tryWithApiKeys(async (apiKey) => {
  const response = await fetch("https://www.virustotal.com/api/v3/files", {
    method: "POST",
      headers: { "x-apikey": apiKey },
    body: form
  });

    if (response.status === 429) {
      return { status: 429, error: 'Rate limit' };
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`VirusTotal upload failed: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`);
    }

    return { status: response.status, data: await response.json() };
  }, 'scanFileWithVirusTotal');

  return result.data;
}

export async function getAnalysis(analysisId) {
  const result = await tryWithApiKeys(async (apiKey) => {
  const response = await fetch(`https://www.virustotal.com/api/v3/analyses/${analysisId}`, {
    method: "GET",
      headers: { "x-apikey": apiKey }
    });

    if (response.status === 429) {
      return { status: 429, error: 'Rate limit' };
    }

    if (!response.ok) {
      throw new Error(`VirusTotal analysis fetch failed: ${response.status} ${response.statusText}`);
    }

    return { status: response.status, data: await response.json() };
  }, 'getAnalysis');

  return result.data;
}

// Comprehensive check of VirusTotal results
// Uses threshold-based approach: blocks only if multiple engines agree or if highly malicious
export function isFileSafe(vtData, fileName = '') {
  if (!vtData?.data) {
    return { safe: false, reason: "Invalid VirusTotal response" };
  }

  const attributes = vtData.data.attributes;
  
  // Check stats
  const stats = attributes.stats || {};
  const malicious = stats.malicious || 0;
  const suspicious = stats.suspicious || 0;
  const timeout = stats.timeout || 0;
  const undetected = stats.undetected || 0;
  const harmless = stats.harmless || 0;
  const totalEngines = malicious + suspicious + harmless + undetected + timeout;

  // Get file extension to determine if it's a code file
  const fileExt = fileName.toLowerCase().split('.').pop() || '';
  const codeExtensions = ['py', 'js', 'ts', 'jsx', 'tsx', 'java', 'cpp', 'c', 'h', 'hpp', 
                          'cs', 'go', 'rs', 'rb', 'php', 'swift', 'kt', 'scala', 'sh', 
                          'bash', 'zsh', 'ps1', 'bat', 'cmd', 'yml', 'yaml', 'json', 
                          'xml', 'html', 'css', 'sql', 'r', 'm', 'pl', 'lua', 'vim', 
                          'md', 'txt', 'log', 'conf', 'config', 'ini', 'toml', 'lock'];
  const isCodeFile = codeExtensions.includes(fileExt);

  // Threshold-based approach:
  // - For code files: Very lenient - Allow if < 5 engines flag as malicious AND < 10 engines flag as suspicious
  //   (Code files often get false positives from antivirus engines)
  // - For other files: Allow if < 2 engines flag as malicious AND < 3 engines flag as suspicious
  // - Always block if >= 10 engines flag as malicious (very high confidence threat)
  const maliciousThreshold = isCodeFile ? 5 : 2;
  const suspiciousThreshold = isCodeFile ? 10 : 3;
  const highConfidenceMaliciousThreshold = 10;

  // High confidence malicious - always block regardless of file type
  if (malicious >= highConfidenceMaliciousThreshold) {
    return {
      safe: false,
      reason: `File flagged as malicious by ${malicious} engine(s) - high confidence threat`,
      stats: stats,
      results: attributes.last_analysis_results || {}
    };
  }

  // Check malicious detections
  if (malicious >= maliciousThreshold) {
    return {
      safe: false,
      reason: `File flagged as malicious by ${malicious} engine(s)`,
      stats: stats,
      results: attributes.last_analysis_results || {}
    };
  }

  // Check suspicious detections (more lenient)
  if (suspicious >= suspiciousThreshold) {
    return {
      safe: false,
      reason: `File flagged as suspicious by ${suspicious} engine(s)`,
      stats: stats,
      results: attributes.last_analysis_results || {}
    };
  }

  // Check individual scan results for high-confidence threats
  const results = attributes.last_analysis_results || {};
  const engineResults = Object.values(results);
  
  // Count how many engines flagged it
  let maliciousCount = 0;
  let suspiciousCount = 0;
  const flaggedEngines = [];
  
  for (const result of engineResults) {
    if (result?.category === 'malicious') {
      maliciousCount++;
      flaggedEngines.push(result.engine_name || 'unknown');
    } else if (result?.category === 'suspicious') {
      suspiciousCount++;
      flaggedEngines.push(result.engine_name || 'unknown');
    }
  }

  // Apply thresholds based on actual engine results
  if (maliciousCount >= maliciousThreshold) {
    return {
      safe: false,
      reason: `File flagged as malicious by ${maliciousCount} engine(s): ${flaggedEngines.slice(0, 3).join(', ')}${flaggedEngines.length > 3 ? '...' : ''}`,
      stats: stats,
      results: results
    };
  }

  if (suspiciousCount >= suspiciousThreshold) {
    return {
      safe: false,
      reason: `File flagged as suspicious by ${suspiciousCount} engine(s): ${flaggedEngines.slice(0, 3).join(', ')}${flaggedEngines.length > 3 ? '...' : ''}`,
      stats: stats,
      results: results
    };
  }

  // Additional safety check: if too many engines timed out, consider it unsafe
  if (totalEngines > 0 && timeout > totalEngines * 0.5) {
    return {
      safe: false,
      reason: `Too many engines timed out (${timeout}/${totalEngines})`,
      stats: stats
    };
  }

  // File is safe - either no detections or below threshold
  return {
    safe: true,
    stats: stats,
    results: results,
    detections: {
      malicious: maliciousCount,
      suspicious: suspiciousCount,
      flaggedEngines: flaggedEngines
    }
  };
}

// Main function to scan a file with comprehensive checks
export async function scanFileComprehensive(buffer, fileName) {
  // Step 1: Calculate file hash and check if already scanned
  const fileHash = calculateFileHash(buffer);
  console.log(`Checking VirusTotal for file hash: ${fileHash}`);
  
  let vtData = await getFileReport(fileHash);
  
  if (vtData && vtData.data) {
    console.log("File found in VirusTotal database, using existing scan results");
    const safetyCheck = isFileSafe(vtData, fileName);
    return {
      hash: fileHash,
      data: vtData.data,
      safetyCheck: safetyCheck,
      fromCache: true
    };
  }

  // Step 2: File not found, upload for new scan
  console.log("File not in VirusTotal database, uploading for analysis");
  const uploadResult = await scanFileWithVirusTotal(buffer, fileName);
  
  if (!uploadResult?.data?.id) {
    throw new Error(uploadResult?.error?.message || "VirusTotal upload failed - no analysis ID returned");
  }

  const analysisId = uploadResult.data.id;
  console.log(`Analysis ID: ${analysisId}, polling for results...`);

  // Step 3: Poll for analysis results with proper timeout
  let result;
  let attempts = 0;
  
  while (attempts < MAX_POLL_ATTEMPTS) {
    attempts++;
    result = await getAnalysis(analysisId);
    
    const status = result?.data?.attributes?.status;
    console.log(`Poll attempt ${attempts}/${MAX_POLL_ATTEMPTS}: Status = ${status}`);
    
    if (status === "completed") {
      // Analysis completed - use results immediately (no need to wait for file report)
      const fileHashFromAnalysis = result?.data?.attributes?.sha256;
      
      // Use analysis results directly (faster than waiting for file report)
      if (result?.data?.attributes?.stats) {
        const safetyCheck = isFileSafe({
          data: {
            attributes: result.data.attributes
          }
        }, fileName);
        return {
          hash: fileHashFromAnalysis || fileHash,
          data: result.data.attributes,
          safetyCheck: safetyCheck,
          fromCache: false
        };
      }
      
      // Fallback: try to get file report if stats not available in analysis
      if (fileHashFromAnalysis) {
        // Try file report but don't wait long
        try {
          vtData = await getFileReport(fileHashFromAnalysis);
          if (vtData && vtData.data) {
            const safetyCheck = isFileSafe(vtData, fileName);
            return {
              hash: fileHashFromAnalysis,
              data: vtData.data,
              safetyCheck: safetyCheck,
              fromCache: false
            };
          }
        } catch (err) {
          // If file report fails, use analysis results
          console.log("File report not available, using analysis results");
        }
      }
    } else if (status === "queued" || status === "in-progress") {
      // Still processing, wait and retry
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      continue;
    } else {
      // Unknown status or error
      throw new Error(`VirusTotal analysis returned unexpected status: ${status}`);
    }
  }

  // Timeout: analysis took too long
  throw new Error(`VirusTotal analysis timeout after ${MAX_POLL_ATTEMPTS} attempts (~${Math.round(MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS / 1000)}s). Please try again later.`);
}
