import React, { useState, useEffect } from "react";
import { Upload, Plus, CheckCircle, AlertCircle, Copy, Shield, Key, Coins, ShoppingCart } from "lucide-react";

const LighthouseUpload = ({ walletAddress }) => {
  const [uploadStatus, setUploadStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [scanResults, setScanResults] = useState(null);
  const [revealedEnvVars, setRevealedEnvVars] = useState([]);
  const [isRevealingEnvVars, setIsRevealingEnvVars] = useState(false);
  const [tokenLaunched, setTokenLaunched] = useState(false); // New state to track token launch
  
  // Token functionality state
  const [tokenBalance, setTokenBalance] = useState("0");
  const [buyAmount, setBuyAmount] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const [isTokenLoading, setIsTokenLoading] = useState(false);
  const [tokenPrice] = useState("0.01"); // 0.01 ETH per token

  // API keys and addresses
  const VT_API_KEY = process.env.REACT_APP_VT_API_KEY;
  const TOKEN_ADDRESS = "0x1004C62953b2ca3f3dca57Efb6be21D3657009Aa";
  const TOTAL_SUPPLY = 100;

  // Environment variables from .env
  const ENV_VARS = [
   
    { name: "DATATOKEN_ADDRESS", value: process.env.REACT_APP_DATATOKEN_ADDRESS, description: "Data token contract" },
    { name: "CREATOR_ADDRESS", value: process.env.REACT_APP_CREATOR_ADDRESS, description: "Creator wallet" }
  ];

  // Check token balance using Web3 provider
  const checkTokenBalance = async () => {
    try {
      if (window.ethereum && walletAddress && tokenLaunched) {
        const provider = new window.ethers.BrowserProvider(window.ethereum);
        
        // ERC20 balanceOf function call
        const tokenContract = new window.ethers.Contract(
          TOKEN_ADDRESS,
          ["function balanceOf(address) view returns (uint256)"],
          provider
        );
        
        const balance = await tokenContract.balanceOf(walletAddress);
        const formattedBalance = window.ethers.formatUnits(balance, 18);
        setTokenBalance(formattedBalance);
      }
    } catch (error) {
      console.error("Error checking token balance:", error);
      setTokenBalance("0");
    }
  };

  // Check token balance when token is launched and wallet changes
  useEffect(() => {
    if (walletAddress && window.ethers && tokenLaunched) {
      checkTokenBalance();
    }
  }, [walletAddress, tokenLaunched]);

  const buyTokens = async () => {
    if (!buyAmount || parseFloat(buyAmount) <= 0) {
      alert("Please enter a valid amount to buy");
      return;
    }

    setIsTokenLoading(true);
    try {
      const provider = new window.ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Calculate ETH needed (buyAmount * tokenPrice)
      const ethNeeded = (parseFloat(buyAmount) * parseFloat(tokenPrice)).toString();
      
      // Send ETH to treasury (simplified token purchase)
      const tx = await signer.sendTransaction({
        to: process.env.REACT_APP_TREASURY,
        value: window.ethers.parseEther(ethNeeded)
      });

      await tx.wait();
      
      alert(`✅ Successfully bought ${buyAmount} tokens for ${ethNeeded} ETH!`);
      setBuyAmount("");
      checkTokenBalance();
      
    } catch (error) {
      console.error("Error buying tokens:", error);
      alert("Failed to buy tokens. Please try again.");
    } finally {
      setIsTokenLoading(false);
    }
  };

  const sellTokens = async () => {
    if (!sellAmount || parseFloat(sellAmount) <= 0) {
      alert("Please enter a valid amount to sell");
      return;
    }

    if (parseFloat(sellAmount) > parseFloat(tokenBalance)) {
      alert("Insufficient token balance");
      return;
    }

    setIsTokenLoading(true);
    try {
      const provider = new window.ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Token contract for transfer
      const tokenContract = new window.ethers.Contract(
        TOKEN_ADDRESS,
        [
          "function transfer(address to, uint256 amount) returns (bool)",
          "function balanceOf(address) view returns (uint256)"
        ],
        signer
      );
      
      // Transfer tokens to treasury
      const tx = await tokenContract.transfer(
        process.env.REACT_APP_TREASURY,
        window.ethers.parseUnits(sellAmount, 18)
      );

      await tx.wait();
      
      alert(`✅ Successfully sold ${sellAmount} tokens!`);
      setSellAmount("");
      checkTokenBalance();
      
    } catch (error) {
      console.error("Error selling tokens:", error);
      alert("Failed to sell tokens. Please try again.");
    } finally {
      setIsTokenLoading(false);
    }
  };

  // Function to reveal environment variables with delays
  const revealEnvironmentVariables = async () => {
    setIsRevealingEnvVars(true);
    setRevealedEnvVars([]);

    for (let i = 0; i < ENV_VARS.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 6000));
      setRevealedEnvVars(prev => [...prev, ENV_VARS[i]]);
    }

    setIsRevealingEnvVars(false);
    
    // Launch token trading interface after all env vars are revealed
    setTimeout(() => {
      setTokenLaunched(true);
    }, 2000); // 2 second delay after env vars are revealed
  };

  const uploadFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setScanResults(null);
    setRevealedEnvVars([]);
    setTokenLaunched(false); // Reset token launch state
    setUploadStatus("Scanning file with VirusTotal...");

    try {
      // Step 1: Upload file to VirusTotal for scanning
      const formData = new FormData();
      formData.append("file", file);

      const vtUploadResponse = await fetch("https://www.virustotal.com/api/v3/files", {
        method: "POST",
        headers: {
          "x-apikey": VT_API_KEY,
        },
        body: formData,
      });

      if (!vtUploadResponse.ok) {
        throw new Error("VirusTotal scan failed");
      }

      const vtUploadData = await vtUploadResponse.json();
      const analysisId = vtUploadData.data.id;

      setUploadStatus("Waiting for scan results...");

      // Step 2: Poll for scan results
      let analysisComplete = false;
      let attempts = 0;
      const maxAttempts = 20;

      while (!analysisComplete && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000));

        const vtReportResponse = await fetch(`https://www.virustotal.com/api/v3/analyses/${analysisId}`, {
          method: "GET",
          headers: {
            "x-apikey": VT_API_KEY,
          },
        });

        if (vtReportResponse.ok) {
          const reportData = await vtReportResponse.json();
          
          if (reportData.data.attributes.status === "completed") {
            analysisComplete = true;
            const stats = reportData.data.attributes.stats;
            setScanResults(stats);

            if (stats.malicious > 0) {
              setUploadStatus("⚠️ File flagged as malicious - Upload blocked");
              setIsUploading(false);
              return;
            }

            if (stats.suspicious > 2) {
              setUploadStatus("⚠️ File flagged as suspicious - Upload blocked");
              setIsUploading(false);
              return;
            }

            setUploadStatus("✅ File is clean - Uploading to Lighthouse...");
          }
        }
        attempts++;
      }

      if (!analysisComplete) {
        throw new Error("Scan timeout - please try again");
      }

      // Step 3: Upload to Lighthouse if file is clean
      const lighthouseFormData = new FormData();
      lighthouseFormData.append("file", file);

      const res = await fetch("http://localhost:5002/upload", {
        method: "POST",
        body: lighthouseFormData,
      });

      if (!res.ok) throw new Error("Lighthouse upload failed");

      const data = await res.json();
      console.log("✅ File uploaded:", data);

      setUploadedFile({
        name: data.Name,
        size: data.Size,
        type: file.type,
        hash: data.Hash,
      });

      setUploadStatus("Upload successful!");
      
      // Start revealing environment variables after successful upload
      revealEnvironmentVariables();

    } catch (err) {
      console.error("Upload error:", err);
      setUploadStatus("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("✅ Copied to clipboard!");
  };

  const copyEnvVar = (envVar) => {
    const envText = `${envVar.name}=${envVar.value}`;
    copyToClipboard(envText);
  };

  // Check if user has tokens for file access
  const hasTokenAccess = parseFloat(tokenBalance) > 0;

  return (
    <div className="bg-white rounded-2xl shadow-lg border overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
        <div className="flex items-center space-x-3">
          <Upload className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">Secure Upload to Lighthouse</h2>
            <p className="opacity-90">
              {tokenLaunched ? "VirusTotal scan + Token-gated storage" : "VirusTotal scan + Decentralized storage"}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Token Balance & Trading - Only show after token is launched */}
        {tokenLaunched && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 mb-6 border animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Coins className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-900">Test Token Balance</h3>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">🚀 Launched!</span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">{parseFloat(tokenBalance).toFixed(4)}</p>
                <p className="text-xs text-gray-500">Total Supply: {TOTAL_SUPPLY}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Buy Tokens */}
              <div className="bg-white rounded-lg p-4 border">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <ShoppingCart className="w-4 h-4 mr-1 text-blue-500" />
                  Buy Tokens
                </h4>
                <div className="space-y-2">
                  <input
                    type="number"
                    placeholder="Amount to buy"
                    value={buyAmount}
                    onChange={(e) => setBuyAmount(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    min="0"
                    step="0.1"
                  />
                  <p className="text-xs text-gray-500">
                    Cost: {buyAmount ? (parseFloat(buyAmount) * parseFloat(tokenPrice)).toFixed(4) : "0"} ETH
                  </p>
                  <button
                    onClick={buyTokens}
                    disabled={isTokenLoading || !buyAmount || !window.ethers}
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50 text-sm"
                  >
                    {isTokenLoading ? "Processing..." : "Buy Tokens"}
                  </button>
                </div>
              </div>

              {/* Sell Tokens */}
              <div className="bg-white rounded-lg p-4 border">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Coins className="w-4 h-4 mr-1 text-green-500" />
                  Sell Tokens
                </h4>
                <div className="space-y-2">
                  <input
                    type="number"
                    placeholder="Amount to sell"
                    value={sellAmount}
                    onChange={(e) => setSellAmount(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    min="0"
                    max={tokenBalance}
                    step="0.1"
                  />
                  <p className="text-xs text-gray-500">
                    You'll receive: {sellAmount ? (parseFloat(sellAmount) * parseFloat(tokenPrice)).toFixed(4) : "0"} ETH
                  </p>
                  <button
                    onClick={sellTokens}
                    disabled={isTokenLoading || !sellAmount || parseFloat(tokenBalance) === 0 || !window.ethers}
                    className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 disabled:opacity-50 text-sm"
                  >
                    {isTokenLoading ? "Processing..." : "Sell Tokens"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Area */}
        <div className="mb-6">
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors bg-gray-50 hover:bg-blue-50">
            <input
              type="file"
              onChange={uploadFile}
              className="hidden"
              id="file-upload"
              disabled={isUploading}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="space-y-4">
                {isUploading ? (
                  <div className="animate-spin">
                    <Upload className="w-12 h-12 mx-auto text-blue-500" />
                  </div>
                ) : (
                  <Plus className="w-12 h-12 mx-auto text-gray-400" />
                )}

                <div>
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    {isUploading ? "Processing..." : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-sm text-gray-500">
                    Files scanned by VirusTotal • Max size: 100MB
                  </p>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Upload Status */}
        {uploadStatus && (
          <div
            className={`p-4 rounded-lg mb-6 flex items-center space-x-3 ${
              uploadStatus.includes("successful")
                ? "bg-green-50 border border-green-200"
                : uploadStatus.includes("flagged") || uploadStatus.includes("blocked")
                ? "bg-red-50 border border-red-200"
                : "bg-blue-50 border border-blue-200"
            }`}
          >
            {uploadStatus.includes("successful") ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : uploadStatus.includes("flagged") || uploadStatus.includes("blocked") ? (
              <AlertCircle className="w-5 h-5 text-red-600" />
            ) : (
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            )}
            <span>{uploadStatus}</span>
          </div>
        )}

        {/* Scan Results */}
        {scanResults && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <Shield className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">Security Scan Results</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Clean:</span>
                <span className="font-medium text-green-600">{scanResults.harmless}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Malicious:</span>
                <span className="font-medium text-red-600">{scanResults.malicious}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Suspicious:</span>
                <span className="font-medium text-yellow-600">{scanResults.suspicious}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Undetected:</span>
                <span className="font-medium text-gray-600">{scanResults.undetected}</span>
              </div>
            </div>
          </div>
        )}

        {/* Environment Variables Section */}
        {(revealedEnvVars.length > 0 || isRevealingEnvVars) && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <Key className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Datacoin is being created...</h3>
              {isRevealingEnvVars && (
                <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
            <div className="space-y-3">
              {revealedEnvVars.map((envVar, index) => (
                <div key={index} className="bg-white rounded-lg p-3 border animate-fadeIn">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-purple-700">{envVar.name}</span>
                    <button
                      onClick={() => copyEnvVar(envVar)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{envVar.description}</p>
                  <p className="font-mono text-xs bg-gray-100 p-2 rounded break-all">
                    {envVar.value}
                  </p>
                </div>
              ))}
              {isRevealingEnvVars && (
                <div className="text-center text-sm text-gray-500">
                  Revealing variables... ({revealedEnvVars.length}/{ENV_VARS.length})
                </div>
              )}
            </div>
          </div>
        )}

        {/* Uploaded File Info with Token Gating */}
        {uploadedFile && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">File Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{uploadedFile.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Size:</span>
                <span className="font-medium">
                  {formatFileSize(uploadedFile.size)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium">{uploadedFile.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">IPFS Hash:</span>
                <span className="font-medium font-mono text-xs bg-white px-2 py-1 rounded">
                  {uploadedFile.hash}
                </span>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => copyToClipboard(`https://gateway.lighthouse.storage/ipfs/${uploadedFile.hash}`)}
                className="flex-1 flex items-center justify-center gap-2 border border-gray-300 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Copy className="w-4 h-4" />
                Copy IPFS Link
              </button>
              
              {/* Token-gated View File button - only show if token is launched */}
              {tokenLaunched ? (
                hasTokenAccess ? (
                  <a
                    href={`https://gateway.lighthouse.storage/ipfs/${uploadedFile.hash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 border border-blue-500 text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    View File
                  </a>
                ) : (
                  <div className="flex-1 flex flex-col">
                    <button
                      disabled
                      className="flex items-center justify-center gap-2 border border-red-300 text-red-400 py-2 px-4 rounded-lg cursor-not-allowed"
                    >
                      🔒 View File (Token Required)
                    </button>
                    <p className="text-xs text-red-500 mt-1 text-center">
                      Buy test tokens to access files
                    </p>
                  </div>
                )
              ) : (
                <a
                  href={`https://gateway.lighthouse.storage/ipfs/${uploadedFile.hash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 border border-blue-500 text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  View File
                </a>
              )}
            </div>
          </div>
        )}

        {/* Wallet Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-600 font-medium">Connected Wallet</p>
          <p className="text-xs text-blue-500 font-mono">{walletAddress}</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default LighthouseUpload;
