import React, { useState } from "react";
import { Upload, Plus, CheckCircle, AlertCircle } from "lucide-react";

const LighthouseUpload = ({ walletAddress }) => {
  const [uploadStatus, setUploadStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  // Upload file to backend
  const uploadFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus("Uploading to Lighthouse...");

    const formData = new FormData();
    formData.append("file", file);
    
    // Optionally append wallet address if you want the server to know it
    if (walletAddress) {
      formData.append("walletAddress", walletAddress);
    }

    try {
      const res = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      console.log("Uploaded:", data);
      
      setUploadedFile({
        name: file.name,
        size: file.size,
        type: file.type,
        hash: data.hash || "QmXXXXXX...",
        url: data.url || "#"
      });
      setUploadStatus("Upload successful!");
    } catch (err) {
      console.error("Upload error:", err);
      setUploadStatus("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
        <div className="flex items-center space-x-3">
          <Upload className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">Upload to Lighthouse</h2>
            <p className="opacity-90">Decentralized storage for your files</p>
          </div>
        </div>
      </div>

      <div className="p-6">
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
                    {isUploading ? "Uploading..." : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports all file types • Max size: 100MB
                  </p>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Upload Status */}
        {uploadStatus && (
          <div className={`p-4 rounded-lg mb-6 flex items-center space-x-3 ${
            uploadStatus.includes('successful') 
              ? 'bg-green-50 border border-green-200' 
              : uploadStatus.includes('failed')
              ? 'bg-red-50 border border-red-200'
              : 'bg-blue-50 border border-blue-200'
          }`}>
            {uploadStatus.includes('successful') ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : uploadStatus.includes('failed') ? (
              <AlertCircle className="w-5 h-5 text-red-600" />
            ) : (
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            )}
            <span className={
              uploadStatus.includes('successful') 
                ? 'text-green-700 font-medium' 
                : uploadStatus.includes('failed')
                ? 'text-red-700 font-medium'
                : 'text-blue-700 font-medium'
            }>
              {uploadStatus}
            </span>
          </div>
        )}

        {/* Uploaded File Info */}
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
                <span className="font-medium">{formatFileSize(uploadedFile.size)}</span>
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
            
            <div className="mt-4 flex space-x-3">
              <button className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">
                Share File
              </button>
              <button className="flex-1 border border-gray-300 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors">
                Copy Link
              </button>
            </div>
          </div>
        )}

        {/* Wallet Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Connected Wallet</p>
              <p className="text-xs text-blue-500 font-mono">{walletAddress}</p>
            </div>
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LighthouseUpload;