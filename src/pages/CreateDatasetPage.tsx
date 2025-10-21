import { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '@/hooks/useWeb3';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { formatFileSize } from '@/utils/web3';
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
              showStatus(`File uploaded successfully! CID: ${response.cid}`, 'success');
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

      xhr.open('POST', '/upload', true);
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

    console.log('Submit clicked. uploadedCid:', uploadedCid);
    
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

    setIsSubmitting(true);
    showStatus('Creating dataset token on blockchain...', 'info');

    try {
      const payload = {
        cid: uploadedCid,
        name: datasetName,
        symbol: tokenSymbol,
        description: description,
      };

      const response = await fetch('/create-dataset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.tokenAddress) {
        showStatus(
          `✅ Dataset created successfully! Token: ${data.tokenAddress}`,
          'success'
        );
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        const errorMsg = data.error || data.message || `Server error (${response.status})`;
        showStatus(`Creation failed: ${errorMsg}`, 'error');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      console.error('Creation error:', err);
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

        <div className="page-container">
          <div className="page-header">
            <div>
              <h2 className="page-subtitle">Create Dataset</h2>
              <p className="page-description">
                Tokenize your data and list it on the marketplace
              </p>
            </div>
          </div>

          <div className="upload-container">
            <h3 className="section-title">📤 Upload & Tokenize</h3>

            <div className="info-box">
              <strong>ℹ️ How it works:</strong> Upload your dataset file, provide details, and we'll
              create an ERC20 token representing your data. You'll get 5% of tokens, platform gets 5%,
              and 90% goes to the marketplace for trading.
            </div>

        <form onSubmit={handleSubmit}>
          {/* File Upload */}
          <div className="form-group">
            <label>📁 Dataset File</label>
            <div
              className="file-upload"
              onClick={() => document.getElementById('fileInput')?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <div className="file-upload-text">Click to upload or drag and drop</div>
              <div className="file-upload-sub">Max size: 10MB (PDF, CSV, JSON, ZIP, etc.)</div>
              <input
                type="file"
                id="fileInput"
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
              />
            </div>
            {selectedFile && (
              <div className="file-name active">
                ✅ Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
              </div>
            )}
            {uploading && (
              <div className="upload-progress active">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                </div>
                <div className="progress-text">
                  {uploadProgress < 100 ? `Uploading: ${Math.round(uploadProgress)}%` : '✅ Upload complete!'}
                </div>
              </div>
            )}
            {uploadedCid && (
              <div className="cid-display active">IPFS CID: {uploadedCid}</div>
            )}
          </div>

          {/* Dataset Name */}
          <div className="form-group">
            <label htmlFor="datasetName">📋 Dataset Name *</label>
            <input
              type="text"
              id="datasetName"
              placeholder="e.g., Medical Records 2024"
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
              required
            />
          </div>

          {/* Token Symbol */}
          <div className="form-group">
            <label htmlFor="tokenSymbol">🏷️ Token Symbol *</label>
            <input
              type="text"
              id="tokenSymbol"
              placeholder="e.g., MEDDATA"
              maxLength={10}
              pattern="[A-Z0-9]+"
              value={tokenSymbol}
              onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())}
              required
            />
            <small style={{ color: '#999', display: 'block', marginTop: '5px' }}>
              Uppercase letters and numbers only, max 10 characters
            </small>
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description">📝 Description (Optional)</label>
            <textarea
              id="description"
              placeholder="Describe your dataset: what it contains, who might be interested, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Status Message */}
              {statusMessage && (
                <div className={`status-message active ${statusType}`}>{statusMessage}</div>
              )}

              {/* Buttons */}
              <div className="button-group">
                <button type="button" className="btn btn-secondary" onClick={() => navigate('/marketplace')}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  Create Dataset & Token
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateDatasetPage;

