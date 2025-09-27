import React, { useState } from "react";
import LighthouseUpload from "./components/LighthouseUpload";
import ReclaimVerification from "./components/ReclaimVerification";

function App() {
  const [isVerified, setIsVerified] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");

  // Callback to pass to ReclaimVerification
  const handleVerificationSuccess = (wallet, proofs) => {
    setWalletAddress(wallet);
    setIsVerified(true);
    console.log("Proofs received:", proofs);
  };

  return (
    <div style={{ padding: "20px" }}>
      {!isVerified ? (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
          <ReclaimVerification onSuccess={handleVerificationSuccess} />
        </div>
      ) : (
        <div style={{ textAlign: "center", marginTop: "30px" }}>
          <h2>✅ Verification Successful!</h2>
          <p>Your wallet address:</p>
          <pre>{walletAddress}</pre>

          <hr style={{ margin: "40px 0" }} />

          <h3>Upload your file to Lighthouse:</h3>
          <LighthouseUpload walletAddress={walletAddress} />
        </div>
      )}
    </div>
  );
}

export default App;
