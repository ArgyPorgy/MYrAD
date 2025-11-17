import { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '@/contexts/Web3Context';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import CustomLoader from '@/components/CustomLoader';
import Toast from '@/components/Toast';
import { formatFileSize } from '@/utils/web3';
import { getApiUrl } from '@/config/api';
import { Upload, FileText, Tag, DollarSign, FileType, Info, X, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import './CreateDatasetPage.css';
const CreateDatasetPage = () => {
  const navigate = useNavigate();
  const { userAddress, connected, connectWallet, disconnectWallet } = useWeb3();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [scanPassed, setScanPassed] = useState(false);
  const [scanning, setScanning] = useState(false); // Track scanning state
  
  const [datasetName, setDatasetName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [description, setDescription] = useState('');
  const TOTAL_SUPPLY = 1_000_000;
  
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const showStatus = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    setStatusMessage(message);
    setStatusType(type);
    setShowToast(true);
  };

  const resetForm = () => {
    // Reset all form fields
    setDatasetName('');
    setTokenSymbol('');
    setDescription('');
    
    // Reset file and scan state
    setSelectedFile(null);
    setScanPassed(false);
    setScanning(false);
    
    // Clear file input element
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const triggerConfetti = () => {
    try {
      const duration = 5000; // 5 seconds of celebration
      const animationEnd = Date.now() + duration;
      const defaults = { 
        startVelocity: 40, 
        spread: 360, 
        ticks: 100, // Longer particle lifetime
        zIndex: 99999, // Very high z-index to ensure it's on top
        colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'],
        gravity: 0.8, // Slower fall for longer visibility
        decay: 0.9 // Slower decay
      };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      // Immediate big burst from center
      confetti({
        ...defaults,
        particleCount: 200,
        origin: { x: 0.5, y: 0.5 },
        angle: 60,
        spread: 70
      });
      confetti({
        ...defaults,
        particleCount: 200,
        origin: { x: 0.5, y: 0.5 },
        angle: 120,
        spread: 70
      });
      confetti({
        ...defaults,
        particleCount: 200,
        origin: { x: 0.5, y: 0.5 },
        angle: 90,
        spread: 70
      });

      // Continuous party popper effect from sides
      const interval: NodeJS.Timeout = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        const particleCount = 80 * (timeLeft / duration);
        
        // Launch from left side (party popper effect)
        confetti({
          ...defaults,
          particleCount: Math.max(20, particleCount),
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        
        // Launch from right side (party popper effect)
        confetti({
          ...defaults,
          particleCount: Math.max(20, particleCount),
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 200); // Check every 200ms for smoother effect

      // Additional bursts at intervals
      setTimeout(() => {
        confetti({
          ...defaults,
          particleCount: 150,
          origin: { x: 0.5, y: 0.5 },
          angle: 45,
          spread: 60
        });
      }, 1000);

      setTimeout(() => {
        confetti({
          ...defaults,
          particleCount: 150,
          origin: { x: 0.5, y: 0.5 },
          angle: 135,
          spread: 60
        });
      }, 2000);

      setTimeout(() => {
        confetti({
          ...defaults,
          particleCount: 150,
          origin: { x: 0.5, y: 0.5 },
          angle: 90,
          spread: 60
        });
      }, 3000);
     
    } catch (err) {
      console.error('Error triggering confetti:', err);
    }
  };

  // STEP 1: ONLY scan with VirusTotal (no Lighthouse upload)
  const scanFile = async (file: File) => {
    try {
      setScanning(true);
      setScanPassed(false);

      const formData = new FormData();
      formData.append("file", file);

      showStatus("Scanning file... You can fill the form while waiting!", "info");

      const response = await fetch(getApiUrl("/upload"), {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.scanPassed) {
        setScanPassed(true);
        showStatus("File scan passed! Click 'Create Dataset Token' when ready.", "success");
      } else {
        // Check if it's a VirusTotal error
        const isVirusTotalError = data.error === "scan_failed" || 
                                   data.error === "vt_scan_failed" ||
                                   data.message?.toLowerCase().includes("virustotal") ||
                                   data.message?.toLowerCase().includes("scan failed");
        
        if (isVirusTotalError) {
          showStatus("VirusTotal scan error. Please refresh the page & try again.", "error");
        } else {
          const errorMsg = data.message || data.error || "Scan failed";
          showStatus(`${errorMsg}`, "error");
        }
        setSelectedFile(null);
      }

      setScanning(false);
    } catch (err: any) {
      // Check if it's a VirusTotal/scan related error
      const isVirusTotalError = err.message?.toLowerCase().includes("virustotal") ||
                                 err.message?.toLowerCase().includes("scan") ||
                                 err.message?.toLowerCase().includes("timeout");
      
      if (isVirusTotalError) {
        showStatus("VirusTotal scan error. Please refresh the page & try again.", "error");
      } else {
        showStatus(`Scan error: ${err.message}`, "error");
      }
      setScanning(false);
      setSelectedFile(null);
    }
  };

  const handleFileSelect = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      showStatus('File size exceeds 10MB limit', 'error');
      return;
    }

    // Block media files (MP3, MP4, etc.)
    const fileName = file.name.toLowerCase();
    const fileExt = fileName.split('.').pop() || '';
    const blockedExtensions = ['mp3', 'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 
                               'm4a', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4v', '3gp'];
    if (blockedExtensions.includes(fileExt)) {
      showStatus(`Media files (${fileExt.toUpperCase()}) are not allowed. Please upload data files only.`, 'error');
      return;
    }

    setSelectedFile(file);
    await scanFile(file);
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // STEP 2: Upload to Lighthouse + Create token
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!scanPassed || !selectedFile) {
      showStatus('Please wait for file scan to complete', 'error');
      return;
    }

    if (!datasetName) {
      showStatus('Please enter a dataset name', 'error');
      return;
    }

    if (!tokenSymbol) {
      showStatus('Please enter a token symbol', 'error');
      return;
    }

    if (!connected || !userAddress) {
      showStatus('Please connect your wallet', 'error');
      return;
    }

    setIsSubmitting(true);
    showStatus('Uploading to Lighthouse and creating token...', 'info');

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("name", datasetName);
      formData.append("symbol", tokenSymbol);
      formData.append("description", description);
      formData.append("totalSupply", TOTAL_SUPPLY.toString());
      formData.append("creatorAddress", userAddress);

      const response = await fetch(getApiUrl('/create-dataset'), {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.success && data.tokenAddress) {
        // Update state first
        setIsSubmitting(false);
        showStatus('Dataset created successfully!', 'success');
        
        // Trigger confetti celebration after React finishes updating DOM
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          setTimeout(() => {
            try {
              triggerConfetti();
            } catch (confettiErr) {
              console.error('Confetti error:', confettiErr);
            }
          }, 200);
        });
        
        // Keep notification visible for 5 seconds, then hide it and reset form
        setTimeout(() => {
          setShowToast(false);
          // Reset form after confetti animation completes (5 seconds)
          resetForm();
        }, 5000);
      } else {
        let errorMsg = data.error || data.message || 'Creation failed';
        
        // Handle duplicate file error specifically
        if (data.error === 'duplicate_file') {
          errorMsg = data.message || 'This file has already been uploaded. Each file can only be used once to create a dataset token.';
          if (data.existingToken) {
            errorMsg += ` The file is already associated with token: ${data.existingToken.name} (${data.existingToken.symbol})`;
          }
        }
        
        // Check if it's a VirusTotal error
        const isVirusTotalError = data.error === "scan_failed" || 
                                   data.error === "vt_scan_failed" ||
                                   data.message?.toLowerCase().includes("virustotal") ||
                                   data.message?.toLowerCase().includes("scan failed") ||
                                   data.error === "duplicate_check_failed";
        
        if (isVirusTotalError) {
          showStatus("VirusTotal scan error. Please refresh the page & try again.", 'error');
        } else {
          showStatus(`Creation failed: ${errorMsg}`, 'error');
        }
        setIsSubmitting(false);
      }
    } catch (err: any) {
      console.error('Creation error:', err);
      
      // Check if it's a VirusTotal/scan related error
      const isVirusTotalError = err.message?.toLowerCase().includes("virustotal") ||
                                 err.message?.toLowerCase().includes("scan") ||
                                 err.message?.toLowerCase().includes("timeout");
      
      if (isVirusTotalError) {
        showStatus("VirusTotal scan error. Please refresh the page & try again.", 'error');
      } else {
        showStatus(`Error: ${err.message}`, 'error');
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      
      <main className="main-content">
        <Header
          userAddress={userAddress}
          connected={connected}
          onConnect={(provider) => connectWallet(provider)}
          onDisconnect={disconnectWallet}
        />

        {isSubmitting && (
          <div className="loader-overlay">
            <div className="loader-content">
              <CustomLoader />
              <p className="loader-text">Uploading to IPFS and creating token...</p>
            </div>
          </div>
        )}

        <div className="page-container">
          <div className="create-dataset-content">
            <div className="page-header">
              <h1 className="page-title">Create Dataset</h1>
              <p className="page-description">
                Upload your file and create a dataset token
              </p>
            </div>

            <div className="upload-container">
              <div className="info-box">
                <div className="info-icon">
                  <Info size={20} strokeWidth={1.5} />
                </div>
                <div className="info-content">
                  <strong>Time-saving tip:</strong> While your file is being scanned, 
                  you can fill out the form below. The button will activate once the scan completes!
                </div>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                {/* File Upload & Scan */}
                <div className="form-group">
                  <label className="form-label">
                    <Upload size={16} strokeWidth={2} />
                    Upload File for Scanning
                  </label>
                  <div
                    className={`file-upload ${selectedFile ? 'has-file' : ''}`}
                    onClick={() => !scanning && !isSubmitting && document.getElementById('fileInput')?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (!scanning && !isSubmitting) {
                        const file = e.dataTransfer.files[0];
                        if (file) handleFileSelect(file);
                      }
                    }}
                  >
                    <div className="file-upload-icon">
                      <Upload size={32} strokeWidth={1.5} />
                    </div>
                    <div className="file-upload-text">
                      {scanning ? "Scanning file..." : "Click to upload or drag and drop"}
                    </div>
                    <div className="file-upload-sub">Max size: 10MB</div>
                    <input
                      type="file"
                      id="fileInput"
                      onChange={handleFileInputChange}
                      style={{ display: 'none' }}
                      accept=".pdf,.csv,.json,.zip,.txt,.xlsx,.xls"
                      disabled={scanning || isSubmitting}
                    />
                  </div>
                  
                  {selectedFile && (
                    <div className="file-name active">
                      <FileText size={16} strokeWidth={2} />
                      <span>{selectedFile.name}</span>
                      <span className="file-size">({formatFileSize(selectedFile.size)})</span>
                    </div>
                  )}
                  
                  {scanning && (
                    <div className="upload-progress active">
                      <div className="progress-bar">
                        <div className="progress-fill scanning-animation"></div>
                      </div>
                      <div className="progress-text">
                        Scanning with VirusTotal... Fill the form below while you wait!
                      </div>
                    </div>
                  )}
                  
                  {scanPassed && (
                    <div className="upload-success-badge">
                      <Check size={16} strokeWidth={2.5} />
                      <span>File scan passed - Ready to create token</span>
                    </div>
                  )}
                </div>

                {/* Form fields - ALWAYS ENABLED (not disabled during scan) */}
                <div className="form-group">
                  <label htmlFor="datasetName" className="form-label">
                    <FileType size={16} strokeWidth={2} />
                    Dataset Name *
                  </label>
                  <input
                    type="text"
                    id="datasetName"
                    className="form-input"
                    placeholder="e.g., Medical Records 2024"
                    value={datasetName}
                    onChange={(e) => setDatasetName(e.target.value)}
                    required
                    disabled={isSubmitting} // Only disabled when submitting, NOT when scanning
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="tokenSymbol" className="form-label">
                    <Tag size={16} strokeWidth={2} />
                    Token Symbol *
                  </label>
                  <input
                    type="text"
                    id="tokenSymbol"
                    className="form-input"
                    placeholder="e.g., MEDDATA"
                    maxLength={10}
                    value={tokenSymbol}
                    onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())}
                    required
                    disabled={isSubmitting} // Only disabled when submitting, NOT when scanning
                  />
                  <small className="form-hint">
                    Uppercase letters and numbers only, max 10 characters
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="totalSupply" className="form-label">
                    <DollarSign size={16} strokeWidth={2} />
                    Total Supply *
                  </label>
                  <input
                    type="number"
                    id="totalSupply"
                    className="form-input"
                    value={TOTAL_SUPPLY}
                    readOnly
                    disabled
                  />
                  <small className="input-helper">Fixed supply of 1,000,000 tokens</small>
                </div>

                <div className="form-group">
                  <label htmlFor="description" className="form-label">
                    <FileText size={16} strokeWidth={2} />
                    Description (Optional)
                  </label>
                  <textarea
                    id="description"
                    className="form-textarea"
                    placeholder="Describe your dataset..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isSubmitting} // Only disabled when submitting, NOT when scanning
                  />
                </div>

                {/* Button status message */}
                {scanning && (
                  <div className="info-box" style={{ marginBottom: '1rem' }}>
                    <div className="info-icon">
                      <Info size={20} strokeWidth={1.5} />
                    </div>
                    <div className="info-content">
                      Button will be enabled once scan completes...
                    </div>
                  </div>
                )}

                <div className="button-group">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => navigate('/create')}
                    disabled={isSubmitting}
                  >
                    <X size={16} strokeWidth={2} />
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={
                      scanning ||           // Disabled while scanning
                      !scanPassed ||        // Disabled if scan not passed
                      !selectedFile ||      // Disabled if no file
                      !datasetName ||       // Disabled if no name
                      !tokenSymbol ||       // Disabled if no symbol
                      !connected ||         // Disabled if wallet not connected
                      isSubmitting          // Disabled while submitting
                    }
                  >
                    <Check size={16} strokeWidth={2} />
                    {isSubmitting ? 'Creating...' : scanning ? 'Scanning...' : 'Create Dataset Token'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
      
      {showToast && (
        <Toast
          message={statusMessage}
          type={statusType}
          onClose={() => setShowToast(false)}
          duration={statusType === 'success' ? 3000 : 5000}
        />
      )}
    </div>
  );
};

export default CreateDatasetPage;