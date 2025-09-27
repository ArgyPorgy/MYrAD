import React, { useState } from "react";
import { ReclaimProofRequest } from "@reclaimprotocol/js-sdk";

const ReclaimVerification = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleVerification = async () => {
    try {
      setIsLoading(true);

      const APP_ID = process.env.RECLAIM_APP;
      const APP_SECRET = process.env.RECLAIM_APP;
      const PROVIDER_ID = process.env.RECLAIM_PROVIDER;

      // Initialize Reclaim SDK
      const reclaimProofRequest = await ReclaimProofRequest.init(
        APP_ID,
        APP_SECRET,
        PROVIDER_ID
      );

      // Trigger Reclaim Flow (popup / QR code)
      await reclaimProofRequest.triggerReclaimFlow();

      // Start verification session
      await reclaimProofRequest.startSession({
        onSuccess: (proofs) => {
          console.log("Verification successful:", proofs);

          // Example: extract wallet address from proofs
          const wallet = proofs?.claims?.[0]?.value || "0xC8deAC6d34df46Acb87D50EF459C1Dc108cE36e6";

          // Call the callback to notify App.jsx
          if (onSuccess) {
            onSuccess(wallet, proofs);
          }

          setIsLoading(false);
        },
        onError: (error) => {
          console.error("Verification failed", error);
          setIsLoading(false);
        },
      });
    } catch (error) {
      console.error("Error starting verification:", error);
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleVerification} disabled={isLoading}>
        {isLoading ? "Verifying..." : "Start Verification"}
      </button>
    </div>
  );
};

export default ReclaimVerification;
