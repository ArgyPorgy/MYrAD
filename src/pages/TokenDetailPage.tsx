import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { useWeb3 } from "@/contexts/Web3Context";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import CustomLoader from "@/components/CustomLoader";
import { Dataset } from "@/types/web3";
import { getApiUrl } from "@/config/api";
import {
  ERC20_ABI,
  MARKETPLACE_ABI,
  USDC_ABI,
  BASE_SEPOLIA_USDC,
} from "@/constants/contracts";
import { retryContractCall, getPublicRpcProvider } from "@/utils/web3";
import {
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  Wallet,
} from "lucide-react";
import "./TokenDetailPage.css";

const MIN_BURN_USDC = ethers.parseUnits("0.5", 6);

const TokenDetailPage = () => {
  const { tokenAddress } = useParams<{ tokenAddress: string }>();
  const navigate = useNavigate();
  const {
    signer,
    userAddress,
    connected,
    connectWallet,
    disconnectWallet,
  } = useWeb3();


  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [price, setPrice] = useState<string>("N/A");
  const [balance, setBalance] = useState<string>("0.00");
  const [balanceRaw, setBalanceRaw] = useState<bigint>(0n);
  const [buyAmount, setBuyAmount] = useState<string>("");
  const [sellAmount, setSellAmount] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");
  const [toasts, setToasts] = useState<
    { id: number; type: "success" | "error"; message: string }[]
  >([]);
  const [hasDownloadAccess, setHasDownloadAccess] = useState<boolean>(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<string>("0.00");
  const publicProvider = getPublicRpcProvider();


  const showToast = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      3500
    );
  };


  const triggerFileDownload = async (url: string, filename?: string) => {
    try {
      const win = window.open(url, "_blank");
      if (win && !win.closed) return;
    } catch {}


    try {
      window.location.href = url;
      return;
    } catch {}


    try {
      const res = await fetch(url, { credentials: "include" });
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename || "dataset";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (e) {
      console.error("Download failed:", e);
    }
  };


  const checkAccessStatus = async () => {
    if (!userAddress || !dataset?.symbol) {
      setHasDownloadAccess(false);
      setDownloadUrl(null);
      return;
    }

    try {
      const accessUrl = getApiUrl(`/access/${userAddress}/${dataset.symbol}`);
      const response = await fetch(accessUrl);
      
      if (response.status === 200) {
        const data = await response.json();
        if (data.download || data.downloadUrl) {
          setHasDownloadAccess(true);
          setDownloadUrl(data.download || data.downloadUrl);
        } else {
          setHasDownloadAccess(false);
          setDownloadUrl(null);
        }
      } else {
        setHasDownloadAccess(false);
        setDownloadUrl(null);
      }
    } catch (err) {
      console.error("Error checking access status:", err);
      setHasDownloadAccess(false);
      setDownloadUrl(null);
    }
  };

  const handleDownload = async () => {
    if (!downloadUrl) return;
    
    try {
      await triggerFileDownload(downloadUrl, `${dataset?.symbol || "dataset"}.zip`);
      showToast("Download started", "success");
    } catch (err) {
      console.error("Download error:", err);
      showToast("Download failed. Please try again.", "error");
    }
  };

  const setMaxBuy = () => {
    setBuyAmount(usdcBalance);
  };

  const setMaxSell = () => {
    setSellAmount(balance);
  };

  useEffect(() => {
    if (tokenAddress) {
      loadDataset();
    }
  }, [tokenAddress]);

  useEffect(() => {
    if (connected && userAddress && dataset?.symbol) {
      checkAccessStatus();
    } else {
      setHasDownloadAccess(false);
      setDownloadUrl(null);
    }
  }, [connected, userAddress, dataset?.symbol]);


  useEffect(() => {
    if (connected && dataset && userAddress) {
      readBalance();
      updatePrice();
    }
  }, [connected, dataset, userAddress]);


  useEffect(() => {
    if (!dataset || !tokenAddress) return;


    const priceInterval = setInterval(() => {
      updatePrice();
    }, 30000);


    return () => clearInterval(priceInterval);
  }, [dataset, tokenAddress]);


  const loadDataset = async () => {
    try {
      setLoading(true);
      const resp = await fetch(getApiUrl("/datasets"));
      const data = await resp.json();

      console.log('All datasets:', Object.keys(data));
      console.log('Looking for token:', tokenAddress);

      // Try case-insensitive match
      const normalizedAddress = tokenAddress!.toLowerCase();
      let foundDataset = data[tokenAddress!];
      
      if (!foundDataset) {
        // Try to find with case-insensitive matching
        const matchingKey = Object.keys(data).find(
          key => key.toLowerCase() === normalizedAddress
        );
        if (matchingKey) {
          foundDataset = data[matchingKey];
          console.log('Found dataset with case-insensitive match:', matchingKey);
        }
      }

      if (foundDataset) {
        setDataset(foundDataset);
      } else {
        console.error('Dataset not found for address:', tokenAddress);
        console.log('Available addresses:', Object.keys(data));
        setStatus("Dataset not found");
      }
    } catch (err) {
      console.error("Error loading dataset:", err);
      setStatus("Error loading dataset");
    } finally {
      setLoading(false);
    }
  };


  const readBalance = async () => {
    try {
      if (!tokenAddress || !userAddress) return;
      const token = new ethers.Contract(tokenAddress, ERC20_ABI, publicProvider);
      const bal = await retryContractCall(() => token.balanceOf(userAddress));
      setBalanceRaw(bal);
      setBalance(ethers.formatUnits(bal, 18));
      
      // Also read USDC balance for max button
      const usdc = new ethers.Contract(BASE_SEPOLIA_USDC, USDC_ABI, publicProvider);
      const usdcBal = await retryContractCall(() => usdc.balanceOf(userAddress));
      setUsdcBalance(ethers.formatUnits(usdcBal, 6));
    } catch (err) {
      setBalance("n/a");
      setBalanceRaw(0n);
      setUsdcBalance("0.00");
    }
  };


  const updatePrice = async (retryCount = 0) => {
    try {
      if (!tokenAddress || !dataset) return;


      const marketplaceAddr =
        dataset.marketplace ||
        dataset.marketplace_address ||
        dataset.bonding_curve;
      if (!marketplaceAddr) {
        setPrice("Marketplace not configured");
        return;
      }


      const resp = await fetch(
        getApiUrl(`/price/${marketplaceAddr}/${tokenAddress}`)
      );


      if (!resp.ok) {
        if (resp.status === 404) {
          // Pool not initialized or legacy contract - show appropriate message
          setPrice("Pool not initialized");
          return;
        }
        throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
      }


      const data = await resp.json();
      const priceNum = parseFloat(data.price);


      if (isNaN(priceNum)) {
        throw new Error("Invalid price data received");
      }


      let formattedPrice;
      if (priceNum === 0) {
        formattedPrice = "0.000000";
      } else if (priceNum < 0.000001) {
        formattedPrice = priceNum.toExponential(2);
      } else if (priceNum < 0.01) {
        formattedPrice = priceNum.toFixed(8);
      } else if (priceNum < 1) {
        formattedPrice = priceNum.toFixed(6);
      } else {
        formattedPrice = priceNum.toFixed(4);
      }


      setPrice(`${formattedPrice} USDC`);
    } catch (err: any) {
      console.error("Price fetch error:", err);


      if (retryCount < 3) {
        setTimeout(() => updatePrice(retryCount + 1), 2000 * (retryCount + 1));
      } else {
        setPrice("Unable to fetch price");
      }
    }
  };


  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(tokenAddress!);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };


  const handleBuy = async () => {
    if (!signer || !dataset || !dataset.marketplace) {
      setStatus("Connect wallet first or marketplace not configured");
      return;
    }


    try {
      setStatus("Processing buy...");
      const marketplace = new ethers.Contract(
        dataset.marketplace,
        MARKETPLACE_ABI,
        signer
      );
      const usdc = new ethers.Contract(BASE_SEPOLIA_USDC, USDC_ABI, signer);
      const usdcAmount = ethers.parseUnits(buyAmount, 6);

      // Check USDC balance
      const usdcBalance: bigint = await retryContractCall(() =>
        usdc.balanceOf(userAddress)
      );
      console.log('Your USDC balance:', ethers.formatUnits(usdcBalance, 6));
      console.log('Amount needed:', ethers.formatUnits(usdcAmount, 6));
      
      if (usdcBalance < usdcAmount) {
        const errorMsg = `Insufficient USDC balance. You have ${ethers.formatUnits(usdcBalance, 6)} USDC but need ${ethers.formatUnits(usdcAmount, 6)} USDC`;
        setStatus(errorMsg);
        showToast(errorMsg, "error");
        return;
      }

      let currentAllowance: bigint = await retryContractCall(() =>
        usdc.allowance(userAddress, dataset.marketplace!)
      );
      console.log('Current USDC allowance:', ethers.formatUnits(currentAllowance, 6));
      
      if (currentAllowance < usdcAmount) {
        setStatus("Approving USDC spending cap...");
        console.log('Requesting approval for spending cap...');
        const approveTx = await retryContractCall(() =>
          usdc.approve(dataset.marketplace!, ethers.MaxUint256)
        );
        console.log('Waiting for approval transaction to confirm...');
        await approveTx.wait();
        console.log('Approval confirmed, verifying allowance...');
        
        // Wait and retry to verify allowance is updated on-chain
        await new Promise(resolve => setTimeout(resolve, 2000));
        let retries = 3;
        while (retries > 0) {
          currentAllowance = await retryContractCall(() =>
            usdc.allowance(userAddress, dataset.marketplace!)
          );
          console.log(`Allowance check (${4-retries}/3):`, ethers.formatUnits(currentAllowance, 6));
          
          if (currentAllowance >= usdcAmount) {
            console.log('Allowance verified, proceeding to buy...');
            break;
          }
          
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        }
        
        if (currentAllowance < usdcAmount) {
          throw new Error('Approval verification failed. Please try again.');
        }
      }

      setStatus("Executing buy transaction...");
      console.log('Initiating buy transaction...');
      const tx = await retryContractCall(() =>
        marketplace.buy(usdcAmount, 0)
      );
      console.log('Waiting for buy transaction to confirm...');
      await tx.wait();
      console.log('Buy transaction confirmed!');


      setStatus("Buy confirmed!");
      showToast("Buy completed successfully", "success");
      setBuyAmount("");
      setTimeout(() => {
        readBalance();
        updatePrice();
      }, 2000);
    } catch (err: any) {
      console.error("Buy error:", err);
      if (err.message?.includes("RPC endpoint returned HTTP client error")) {
        setStatus("Network error: RPC endpoint timeout. Please try again.");
      } else if (err.message?.includes("execution reverted")) {
        setStatus("Transaction failed: " + err.message);
      } else {
        setStatus("Buy failed: " + (err?.message || err));
      }
    }
  };


  const handleSell = async () => {
    if (!signer || !dataset || !dataset.marketplace) {
      setStatus("Connect wallet first or marketplace not configured");
      return;
    }


    try {
      setStatus("Processing sell...");
      const marketplace = new ethers.Contract(
        dataset.marketplace,
        MARKETPLACE_ABI,
        signer
      );
      const token = new ethers.Contract(tokenAddress!, ERC20_ABI, signer);
      const tokenAmount = ethers.parseUnits(sellAmount, 18);

      // Check token balance
      const tokenBalance: bigint = await retryContractCall(() =>
        token.balanceOf(userAddress)
      );
      console.log('Your token balance:', ethers.formatUnits(tokenBalance, 18));
      console.log('Amount needed:', ethers.formatUnits(tokenAmount, 18));
      
      if (tokenBalance < tokenAmount) {
        const errorMsg = `Insufficient token balance. You have ${ethers.formatUnits(tokenBalance, 18)} tokens but need ${ethers.formatUnits(tokenAmount, 18)} tokens`;
        setStatus(errorMsg);
        showToast(errorMsg, "error");
        return;
      }

      let currentAllowance: bigint = await retryContractCall(() =>
        token.allowance(userAddress, dataset.marketplace!)
      );
      console.log('Current token allowance:', ethers.formatUnits(currentAllowance, 18));
      
      if (currentAllowance < tokenAmount) {
        setStatus("Approving token spending cap...");
        console.log('Requesting approval for token spending cap...');
        const approveTx = await retryContractCall(() =>
          token.approve(dataset.marketplace!, ethers.MaxUint256)
        );
        console.log('Waiting for approval transaction to confirm...');
        await approveTx.wait();
        console.log('Approval confirmed, verifying allowance...');
        
        // Wait and retry to verify allowance is updated on-chain
        await new Promise(resolve => setTimeout(resolve, 2000));
        let retries = 3;
        while (retries > 0) {
          currentAllowance = await retryContractCall(() =>
            token.allowance(userAddress, dataset.marketplace!)
          );
          console.log(`Allowance check (${4-retries}/3):`, ethers.formatUnits(currentAllowance, 18));
          
          if (currentAllowance >= tokenAmount) {
            console.log('Allowance verified, proceeding to sell...');
            break;
          }
          
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        }
        
        if (currentAllowance < tokenAmount) {
          throw new Error('Approval verification failed. Please try again.');
        }
      }

      setStatus("Executing sell transaction...");
      console.log('Initiating sell transaction...');
      const tx = await retryContractCall(() =>
        marketplace.sell(tokenAmount, 0)
      );
      console.log('Waiting for sell transaction to confirm...');
      await tx.wait();
      console.log('Sell transaction confirmed!');


      setStatus("Sell confirmed!");
      showToast("Sell completed successfully", "success");
      setSellAmount("");
      setTimeout(() => {
        readBalance();
        updatePrice();
      }, 2000);
    } catch (err: any) {
      console.error("Sell error:", err);
      if (err.message?.includes("RPC endpoint returned HTTP client error")) {
        setStatus("Network error: RPC endpoint timeout. Please try again.");
      } else if (err.message?.includes("execution reverted")) {
        setStatus("Transaction failed: " + err.message);
      } else {
        setStatus("Sell failed: " + (err?.message || err));
      }
    }
  };


  const handleBurn = async () => {
    if (!signer || !dataset || !dataset.marketplace) {
      setStatus("Connect wallet first or marketplace not configured");
      return;
    }


    try {
      setStatus("Burning tokens for access...");

      const token = new ethers.Contract(tokenAddress!, ERC20_ABI, signer);

      const marketplace = new ethers.Contract(
        dataset.marketplace,
        MARKETPLACE_ABI,
        signer
      );
      const [poolTokenReserve, poolUsdcReserve] = await retryContractCall(() =>
        marketplace.getReserves()
      );
      if (poolUsdcReserve === 0n) {
        setStatus("Pool USDC reserve is empty. Unable to process burn.");
        showToast("Liquidity pool depleted. Try again later.", "error");
        return;
      }

      const minTokensRequired =
        ((MIN_BURN_USDC * poolTokenReserve) + (poolUsdcReserve - 1n)) /
        poolUsdcReserve;

      if (balanceRaw < minTokensRequired) {
        const minTokensFmt = ethers.formatUnits(minTokensRequired, 18);
        const minTokensDisplay = Number.parseFloat(minTokensFmt);
        const formattedTokens = Number.isFinite(minTokensDisplay)
          ? minTokensDisplay.toLocaleString()
          : minTokensFmt;
        setStatus("Need at least $0.5 worth of tokens to unlock the dataset.");
        showToast(
          `Hold at least ${formattedTokens} tokens (~$0.5) before burning.`,
          "error"
        );
        return;
      }

      const maxBurnable =
        poolTokenReserve > 1n ? poolTokenReserve - 1n : 0n;

      if (maxBurnable < minTokensRequired) {
        setStatus("Pool lacks sufficient liquidity to process the minimum burn. Try again later.");
        showToast("Pool liquidity too low for the minimum burn requirement.", "error");
        return;
      }

      const burnAmount = minTokensRequired;

      let currentAllowance: bigint = await retryContractCall(() =>
        token.allowance(userAddress, dataset.marketplace!)
      );
      if (currentAllowance < burnAmount) {
        setStatus("Approving token burn spending cap...");
        const approveTx = await retryContractCall(() =>
          token.approve(dataset.marketplace!, ethers.MaxUint256)
        );
        await approveTx.wait();
        
        // Wait and retry to verify allowance is updated on-chain
        await new Promise(resolve => setTimeout(resolve, 2000));
        let retries = 3;
        while (retries > 0) {
          currentAllowance = await retryContractCall(() =>
            token.allowance(userAddress, dataset.marketplace!)
          );
          
          if (currentAllowance >= burnAmount) {
            break;
          }
          
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        }
        
        if (currentAllowance < burnAmount) {
          throw new Error('Approval verification failed. Please try again.');
        }
      }


      setStatus("Burning tokens from pool...");
      const burnTx = await retryContractCall(() =>
        marketplace.burnForAccess(burnAmount)
      );
      await burnTx.wait();


      setStatus("Burn processed (50% burned, 50% returned). Your dataset is ready!");
      showToast("Burn completed successfully. Your dataset is ready to download!", "success");

      // Try fast-track first
      try {
        const fastTrackResp = await fetch(getApiUrl("/access/fast-track"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            txHash: burnTx.hash,
            userAddress,
            tokenAddress,
            marketplaceAddress:
              dataset?.marketplace ||
              dataset?.marketplace_address ||
              dataset?.bonding_curve,
            symbol: dataset?.symbol,
          }),
        });

        if (fastTrackResp.ok) {
          const fastTrackData = await fastTrackResp.json();
          if (fastTrackData?.download) {
            setHasDownloadAccess(true);
            setDownloadUrl(fastTrackData.download);
            readBalance();
            updatePrice();
            return;
          }
        }
      } catch (fastTrackError) {
        console.error("Fast-track error:", fastTrackError);
      }

      // If fast-track didn't work, retry checking access status
      let accessGranted = false;
      for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        
        // Check access directly
        try {
          const accessUrl = getApiUrl(`/access/${userAddress}/${dataset?.symbol}`);
          const response = await fetch(accessUrl);
          
          if (response.status === 200) {
            const data = await response.json();
            if (data.download || data.downloadUrl) {
              setHasDownloadAccess(true);
              setDownloadUrl(data.download || data.downloadUrl);
              accessGranted = true;
              break;
            }
          }
        } catch (err) {
          console.error("Error checking access:", err);
        }
      }

      if (!accessGranted) {
        setStatus("Burn confirmed. Download access may take a moment to process.");
      }
      
      readBalance();
      updatePrice();
    } catch (err: any) {
      console.error("Burn error:", err);
      if (err.message?.includes("burn exceeds pool")) {
        setStatus(
          "Burn failed: Trying to burn more tokens than available in pool. Try burning fewer tokens."
        );
      } else if (
        err.message?.includes("RPC endpoint returned HTTP client error")
      ) {
        setStatus("Network error: RPC endpoint timeout. Please try again.");
      } else if (err.message?.includes("execution reverted")) {
        setStatus("Transaction failed: " + err.message);
      } else {
        setStatus("Burn failed: " + (err?.message || err));
      }
    }
  };


  if (loading) {
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
            <div className="token-detail-content">
              <div className="token-loading-container">
                <CustomLoader />
                <p className="loading-message">Loading token...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }


  if (!dataset) {
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
            <div className="token-detail-content">
              <div className="error-container">
                <h2>Dataset not found</h2>
                <button onClick={() => navigate("/marketplace")}>
                  Back to Marketplace
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }


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
          <div className="token-detail-content">
            <div className="toast-container">
              {toasts.map((t) => (
                <div key={t.id} className={`toast ${t.type}`}>
                  {t.message}
                </div>
              ))}
            </div>


            <div className="page-header">
              <h1 className="page-title">{dataset.name || dataset.symbol}</h1>
              <p className="page-description">
                Trade and manage your {dataset.symbol} position
              </p>
            </div>


            <div className="trading-main-wrapper">
              <div className="chart-area">
                <div className="chart-svg-background">
                  <img src="/chart.svg" alt="" />
                </div>
                <div className="chart-placeholder">
                  <h3>Chart Available On Mainnet</h3>
                </div>
              </div>


              {connected ? (
                <div className="trading-container">
                  <div className="trade-tabs">
                    <button
                      className={`tab-btn ${
                        activeTab === "buy" ? "active" : ""
                      }`}
                      onClick={() => setActiveTab("buy")}
                    >
                      <TrendingUp size={16} strokeWidth={2} />
                      Buy
                    </button>
                    <button
                      className={`tab-btn ${
                        activeTab === "sell" ? "active" : ""
                      }`}
                      onClick={() => setActiveTab("sell")}
                    >
                      <TrendingDown size={16} strokeWidth={2} />
                      Sell
                    </button>
                  </div>


                  <div className="trade-form">
                    {activeTab === "buy" ? (
                      <div className="trade-group">
                        <label className="trade-label">USDC Amount</label>
                        <div className="trade-input-wrapper">
                          <input
                            type="text"
                            placeholder="0.00"
                            value={buyAmount}
                            onChange={(e) => setBuyAmount(e.target.value)}
                            className="trade-input"
                          />
                          <button className="max-button" onClick={setMaxBuy}>
                            MAX
                          </button>
                        </div>
                        <button className="trade-btn buy" onClick={handleBuy}>
                          <TrendingUp size={16} strokeWidth={2} />
                          Buy {dataset.symbol}
                        </button>
                      </div>
                    ) : (
                      <div className="trade-group">
                        <label className="trade-label">Token Amount</label>
                        <div className="trade-input-wrapper">
                          <input
                            type="text"
                            placeholder="0.00"
                            value={sellAmount}
                            onChange={(e) => setSellAmount(e.target.value)}
                            className="trade-input"
                          />
                          <button className="max-button" onClick={setMaxSell}>
                            MAX
                          </button>
                        </div>
                        <button className="trade-btn sell" onClick={handleSell}>
                          <TrendingDown size={16} strokeWidth={2} />
                          Sell {dataset.symbol}
                        </button>
                      </div>
                    )}
                  </div>


                  {hasDownloadAccess ? (
                    <button className="download-button" onClick={handleDownload}>
                      Your dataset is ready, download it
                    </button>
                  ) : (
                    <>
                      <button className="burn-button" onClick={handleBurn}>
                        Burn {dataset.symbol} for Access
                      </button>
                      <p className="burn-requirement">
                        * You must burn at least $0.50 worth of tokens to unlock the dataset. Half the tokens are burned permanently and half are returned to the pool.
                      </p>
                    </>
                  )}

                  {status && <div className="status-message">{status}</div>}
                </div>
              ) : (
                <div className="trading-container">
                  <div className="connect-prompt">
                    <div className="connect-icon">
                      <Wallet size={48} strokeWidth={1.5} />
                    </div>
                    <h3>Connect Your Wallet</h3>
                    <p>Connect your wallet to start trading</p>
                    <button
                      className="connect-btn"
                      onClick={() => connectWallet()}
                    >
                      Connect Wallet
                    </button>
                  </div>
                </div>
              )}
            </div>


            <div className="token-stats-grid">
              <div className="stat-card">
                <div className="stat-header">
                  <h3 className="stat-title">Current Price</h3>
                  <div className="stat-icon">
                    <TrendingUp size={20} strokeWidth={1.5} />
                  </div>
                </div>
                <div className="stat-value">{price}</div>
                <p className="stat-description">USDC per token</p>
              </div>


              <div className="stat-card">
                <div className="stat-header">
                  <h3 className="stat-title">Your Balance</h3>
                  <div className="stat-icon">
                    <Wallet size={20} strokeWidth={1.5} />
                  </div>
                </div>
                <div className="stat-value">
                  {parseFloat(balance).toFixed(2)}
                </div>
                <p className="stat-description">{dataset.symbol} tokens held</p>
              </div>


              <div className="stat-card">
                <div className="stat-header">
                  <h3 className="stat-title">Total Supply</h3>
                  <div className="stat-icon">
                    <TrendingUp size={20} strokeWidth={1.5} />
                  </div>
                </div>
                <div className="stat-value">
                  {dataset.total_supply
                    ? (dataset.total_supply / 1e6).toFixed(1)
                    : "100"}
                  M
                </div>
                <p className="stat-description">Total tokens issued</p>
              </div>
            </div>


            <div className="info-section">
              <h2 className="section-title">Token Details</h2>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Contract Address</span>
                  <div className="info-value-with-copy" onClick={copyToClipboard}>
                    <span className="info-value">
                      {tokenAddress?.slice(0, 6)}...{tokenAddress?.slice(-4)}
                    </span>
                    <button className="copy-btn" onClick={copyToClipboard}>
                      {copied ? (
                        <Check size={16} strokeWidth={2} />
                      ) : (
                        <Copy size={16} strokeWidth={2} />
                      )}
                    </button>
                  </div>
                </div>


                <div className="info-item">
                  <span className="info-label">Blockchain</span>
                  <span className="info-value">Base Sepolia</span>
                </div>


                <div className="info-item full-width">
                  <span className="info-label">Description</span>
                  <p className="info-description">
                    {dataset.description || "No description available"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};


export default TokenDetailPage;
