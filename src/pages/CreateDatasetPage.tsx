import { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '@/hooks/useWeb3';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import CustomLoader from '@/components/CustomLoader';
import { formatFileSize } from '@/utils/web3';
import { getApiUrl } from '@/config/api';
import { Upload, FileText, Tag, DollarSign, FileType, Info, X, Check } from 'lucide-react';
import './CreateDatasetPage.css';

const CreateDatasetPage = () => {
  const navigate = useNavigate();
  const { userAddress, connected, connectWallet, disconnectWallet } = useWeb3();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedCid, setUploadedCid] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [datasetName, setDatasetName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [description, setDescription] = useState('');
  const [totalSupply, setTotalSupply] = useState('1000000');
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error' | 'info'>('info');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showStatus = (message: string, type: 'success' | 'error' | 'info') => {
    setStatusMessage(message);
    setStatusType(type);
  };

  const handleFileSelect = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      showStatus('File size exceeds 10MB limit', 'error');
      return;
    }

    setSelectedFile(file);
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    try {
      setUploading(true);
      setUploadedCid('');
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = (e.loaded / e.total) * 100;
          setUploadProgress(percent);
        }
      });

      xhr.addEventListener('load', () => {
        setUploading(false);
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            console.log('✅ Upload success:', response);
            
            if (response.cid) {
              setUploadedCid(response.cid);
              setUploadProgress(100);
              showStatus(`File uploaded successfully to IPFS!`, 'success');
            } else {
              console.error('No CID in response:', response);
              showStatus('Upload failed: No CID returned', 'error');
            }
          } catch (err: any) {
            console.error('Parse error:', err);
            showStatus('Upload failed: Invalid response', 'error');
          }
        } else {
          console.error('Upload failed with status:', xhr.status, xhr.responseText);
          try {
            const error = JSON.parse(xhr.responseText);
            showStatus(`Upload failed: ${error.message || error.error}`, 'error');
          } catch {
            showStatus(`Upload failed: Server error (${xhr.status})`, 'error');
          }
        }
      });

      xhr.addEventListener('error', () => {
        showStatus('Upload failed: Network error', 'error');
        setUploading(false);
      });

      xhr.open('POST', getApiUrl('/upload'), true);
      xhr.send(formData);
    } catch (err: any) {
      showStatus(`Upload error: ${err.message}`, 'error');
      setUploading(false);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('🚀 Submit handler started');
    console.log('   uploadedCid:', uploadedCid);
    console.log('   datasetName:', datasetName);
    console.log('   tokenSymbol:', tokenSymbol);
    
    if (!uploadedCid) {
      showStatus('Please upload a file first', 'error');
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

    const supplyNum = parseInt(totalSupply);
    if (isNaN(supplyNum) || supplyNum <= 0) {
      showStatus('Please enter a valid total supply', 'error');
      return;
    }

    if (!connected || !userAddress) {
      showStatus('Please connect your wallet', 'error');
      return;
    }

    setIsSubmitting(true);
    showStatus('Creating dataset token on blockchain...', 'info');

    try {
      const payload = {
        cid: uploadedCid,
        name: datasetName,
        symbol: tokenSymbol,
        description: description,
        totalSupply: supplyNum,
        creatorAddress: userAddress,
      };

      console.log('📤 Sending payload:', payload);

      // Add timeout to fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 min timeout

      try {
        const response = await fetch(getApiUrl('/create-dataset'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        console.log('📨 Response status:', response.status);
        console.log('📨 Response ok:', response.ok);

        const data = await response.json();
        console.log('📥 Response data:', data);

        if (response.ok && data.success) {
          // New async flow - poll for completion
          if (data.jobId) {
            console.log('🔄 Job started, polling for completion...');
            showStatus('Creating dataset on blockchain...', 'info');
            
            // Poll for status
            const pollInterval = setInterval(async () => {
              try {
                const statusResponse = await fetch(getApiUrl(`/dataset-status/${data.jobId}`));
                const statusData = await statusResponse.json();
                
                console.log('📊 Status update:', statusData);
                
                if (statusData.status === 'completed' && statusData.tokenAddress) {
                  clearInterval(pollInterval);
                  console.log('✅ Dataset creation completed!');
                  
                  const tokenAddress = statusData.tokenAddress;
                  showStatus('Dataset created successfully! Redirecting...', 'success');
                  
                  setTimeout(() => {
                    console.log('🔄 Navigating to:', `/token/${tokenAddress}`);
                    navigate(`/token/${tokenAddress}`, { 
                      replace: false,
                      state: { 
                        fromCreate: true,
                        tokenData: {
                          address: tokenAddress,
                          name: datasetName,
                          symbol: tokenSymbol
                        }
                      }
                    });
                  }, 500);
                } else if (statusData.status === 'failed') {
                  clearInterval(pollInterval);
                  console.error('❌ Dataset creation failed');
                  showStatus(`Creation failed: ${statusData.message}`, 'error');
                  setIsSubmitting(false);
                } else {
                  // Still processing
                  showStatus(statusData.message || 'Creating dataset on blockchain...', 'info');
                }
              } catch (pollError) {
                console.error('Poll error:', pollError);
                // Continue polling even if one request fails
              }
            }, 3000); // Poll every 3 seconds
            
            // Timeout after 2 minutes
            setTimeout(() => {
              clearInterval(pollInterval);
              showStatus('Creation is taking longer than expected. Please check My Datasets.', 'error');
              setIsSubmitting(false);
            }, 120000);
            
          } else if (data.tokenAddress) {
            // Old sync flow - immediate response (backward compatible)
            const tokenAddress = data.tokenAddress;
            console.log('✅ SUCCESS! Token address:', tokenAddress);
          
            showStatus('Dataset created successfully! Redirecting...', 'success');
          
            console.log('🔄 About to navigate to:', `/token/${tokenAddress}`);
          
            requestAnimationFrame(() => {
              try {
                navigate(`/token/${tokenAddress}`, { 
                  replace: false,
                  state: { 
                    fromCreate: true,
                    tokenData: {
                      address: tokenAddress,
                      name: datasetName,
                      symbol: tokenSymbol
                    }
                  }
                });
              
                console.log('✅ Navigation called successfully');
              } catch (navError) {
                console.error('❌ Navigation error:', navError);
                window.location.href = `/token/${tokenAddress}`;
              }
            });
          }
        } else {
          const errorMsg = data.error || data.message || `Server error (${response.status})`;
          console.error('❌ Creation failed:', errorMsg);
          showStatus(`Creation failed: ${errorMsg}`, 'error');
          setIsSubmitting(false);
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.error('❌ Request timeout');
          showStatus('Request timeout - please check your connection', 'error');
        } else {
          throw fetchError;
        }
        setIsSubmitting(false);
      }
    } catch (err: any) {
      console.error('❌ Creation error:', err);
      showStatus(`Error: ${err.message}`, 'error');
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

        {/* FULL SCREEN LOADER OVERLAY */}
        {isSubmitting && (
          <div className="loader-overlay">
            <div className="loader-content">
              <CustomLoader />
              <p className="loader-text">
                Creating your dataset token...
              </p>
            </div>
          </div>
        )}

        <div className="page-container">
          <div className="create-dataset-content">
            <div className="page-header">
              <h1 className="page-title">Create Dataset</h1>
              <p className="page-description">
                Tokenize your data and list it on the marketplace
              </p>
            </div>

            <div className="upload-container">
              <div className="info-box">
                <div className="info-icon">
                  <Info size={20} strokeWidth={1.5} />
                </div>
                <div className="info-content">
                  <strong>How it works:</strong> Upload your dataset file, provide details, and we'll
                  create an ERC20 token representing your data. You'll get 10% of tokens, 5% goes to treasury,
                  and 85% goes to the liquidity pool for trading.
                </div>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                {/* File Upload */}
                <div className="form-group">
                  <label className="form-label">
                    <Upload size={16} strokeWidth={2} />
                    Dataset File
                  </label>
                  <div
                    className={`file-upload ${selectedFile ? 'has-file' : ''}`}
                    onClick={() => document.getElementById('fileInput')?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                  >
                    <div className="file-upload-icon">
                      <Upload size={32} strokeWidth={1.5} />
                    </div>
                    <div className="file-upload-text">Click to upload or drag and drop</div>
                    <div className="file-upload-sub">Max size: 10MB (PDF, CSV, JSON, ZIP, etc.)</div>
                    <input
                      type="file"
                      id="fileInput"
                      onChange={handleFileInputChange}
                      style={{ display: 'none' }}
                      accept=".pdf,.csv,.json,.zip,.txt,.xlsx,.xls"
                    />
                  </div>
                  {selectedFile && (
                    <div className="file-name active">
                      <FileText size={16} strokeWidth={2} />
                      <span>{selectedFile.name}</span>
                      <span className="file-size">({formatFileSize(selectedFile.size)})</span>
                    </div>
                  )}
                  {uploading && (
                    <div className="upload-progress active">
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                      </div>
                      <div className="progress-text">
                        {uploadProgress < 100 ? `Uploading: ${Math.round(uploadProgress)}%` : 'Upload complete!'}
                      </div>
                    </div>
                  )}
                  {uploadedCid && (
                    <div className="upload-success-badge">
                      <Check size={16} strokeWidth={2.5} />
                      <span>File secured on IPFS</span>
                    </div>
                  )}
                </div>

                {/* Dataset Name */}
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
                    disabled={isSubmitting}
                  />
                </div>

                {/* Token Symbol */}
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
                    pattern="[A-Z0-9]+"
                    value={tokenSymbol}
                    onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())}
                    required
                    disabled={isSubmitting}
                  />
                  <small className="form-hint">
                    Uppercase letters and numbers only, max 10 characters
                  </small>
                </div>

                {/* Total Supply */}
                <div className="form-group">
                  <label htmlFor="totalSupply" className="form-label">
                    <DollarSign size={16} strokeWidth={2} />
                    Total Supply *
                  </label>
                  <input
                    type="number"
                    id="totalSupply"
                    className="form-input"
                    placeholder="1000000"
                    value={totalSupply}
                    onChange={(e) => setTotalSupply(e.target.value)}
                    min="1"
                    required
                    disabled={isSubmitting}
                  />
                  <small className="form-hint">
                    Total number of tokens to create (default: 1,000,000)
                  </small>
                </div>

                {/* Description */}
                <div className="form-group">
                  <label htmlFor="description" className="form-label">
                    <FileText size={16} strokeWidth={2} />
                    Description (Optional)
                  </label>
                  <textarea
                    id="description"
                    className="form-textarea"
                    placeholder="Describe your dataset: what it contains, who might be interested, etc."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Status Message */}
                {statusMessage && (
                  <div className={`status-message active ${statusType}`}>
                    {statusType === 'success' && <Check size={18} strokeWidth={2.5} />}
                    {statusType === 'error' && <X size={18} strokeWidth={2.5} />}
                    {statusType === 'info' && <Info size={18} strokeWidth={2} />}
                    <span>{statusMessage}</span>
                  </div>
                )}

                {/* Buttons */}
                <div className="button-group">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => navigate('/marketplace')}
                    disabled={isSubmitting}
                  >
                    <X size={16} strokeWidth={2} />
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={isSubmitting || !uploadedCid}
                  >
                    <Check size={16} strokeWidth={2} />
                    {isSubmitting ? 'Creating...' : 'Create Dataset Token'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateDatasetPage;