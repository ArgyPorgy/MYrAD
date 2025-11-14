import fetch from "node-fetch";
import FormData from "form-data";

const VT_API_KEY = "f6c993911283771cd18a0bc8c0d9cdf6942b9666653530edea01f29317cffea0";

export async function scanFileWithVirusTotal(buffer, fileName) {
  const form = new FormData();
  form.append("file", buffer, fileName);

  const response = await fetch("https://www.virustotal.com/api/v3/files", {
    method: "POST",
    headers: { "x-apikey": VT_API_KEY },
    body: form
  });

  return await response.json();
}

export async function getAnalysis(analysisId) {
  const response = await fetch(`https://www.virustotal.com/api/v3/analyses/${analysisId}`, {
    method: "GET",
    headers: { "x-apikey": VT_API_KEY }
  });

  return await response.json();
}
