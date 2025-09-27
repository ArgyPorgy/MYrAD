import React, { useState } from "react";
import { ReclaimProofRequest } from "@reclaimprotocol/js-sdk";
import { Shield, CheckCircle, AlertCircle, Loader } from "lucide-react";

const ReclaimVerification = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [verificationStep, setVerificationStep] = useState("idle"); // idle, initializing, verifying, success, error
  const [errorMessage, setErrorMessage] = useState("");

  const handleVerification = async () => {
    try {
      setIsLoading(true);
      setVerificationStep("initializing");
      setErrorMessage("");

      const APP_ID = process.env.REACT_APP_RECLAIM_ID;
      const APP_SECRET = process.env.REACT_APP_RECLAIM_APP;
      const PROVIDER_ID = process.env.REACT_APP_RECLAIM_PROVIDER;

      // Initialize Reclaim SDK
      const reclaimProofRequest = await ReclaimProofRequest.init(
        APP_ID,
        APP_SECRET,
        PROVIDER_ID
      );

      setVerificationStep("verifying");

      // Trigger Reclaim Flow (popup / QR code)
      await reclaimProofRequest.triggerReclaimFlow();

      // Start verification session
      await reclaimProofRequest.startSession({
        onSuccess: (proofs) => {
          console.log("Verification successful:", proofs);
          setVerificationStep("success");
          
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
          setVerificationStep("error");
          setErrorMessage(error.message || "Verification failed. Please try again.");
          setIsLoading(false);
        },
      });
    } catch (error) {
      console.error("Error starting verification:", error);
      setVerificationStep("error");
      setErrorMessage(error.message || "Failed to initialize verification.");
      setIsLoading(false);
    }
  };

  const getStepIcon = () => {
    switch (verificationStep) {
      case "initializing":
      case "verifying":
        return <Loader className="w-8 h-8 animate-spin" />;
      case "success":
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case "error":
        return <AlertCircle className="w-8 h-8 text-red-500" />;
      default:
        return <Shield className="w-8 h-8" />;
    }
  };

  const getStepMessage = () => {
    switch (verificationStep) {
      case "initializing":
        return "Initializing verification...";
      case "verifying":
        return "Please complete the verification process";
      case "success":
        return "Verification successful!";
      case "error":
        return errorMessage || "Verification failed";
      default:
        return "Connect your wallet and verify your identity to access the marketplace";
    }
  };

  const getButtonText = () => {
    switch (verificationStep) {
      case "initializing":
        return "Initializing...";
      case "verifying":
        return "Verifying...";
      case "error":
        return "Try Again";
      default:
        return "Start Verification";
    }
  };

  return (
    <div className="text-center space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-8 rounded-2xl text-white shadow-xl">
        {/* Icon */}
        <div className="mb-6">
          {getStepIcon()}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold mb-2">
          {verificationStep === "success" ? "Welcome to MarketSocial!" : "Verify Your Identity"}
        </h2>

        {/* Description */}
        <p className="opacity-90 mb-6 text-lg">
          {getStepMessage()}
        </p>

        {/* Progress Steps */}
        {(verificationStep === "initializing" || verificationStep === "verifying") && (
          <div className="mb-6">
            <div className="flex justify-center space-x-4 mb-4">
              <div className={`w-3 h-3 rounded-full ${
                verificationStep === "initializing" || verificationStep === "verifying" 
                  ? "bg-white" : "bg-white/50"
              }`} />
              <div className={`w-3 h-3 rounded-full ${
                verificationStep === "verifying" ? "bg-white" : "bg-white/50"
              }`} />
            </div>
            <p className="text-sm opacity-75">
              {verificationStep === "initializing" 
                ? "Setting up verification..." 
                : "Complete the verification in the popup"
              }
            </p>
          </div>
        )}

        {/* Error Message */}
        {verificationStep === "error" && (
          <div className="mb-6 p-4 bg-red-500/20 rounded-lg border border-red-300/30">
            <p className="text-red-100">{errorMessage}</p>
          </div>
        )}

        {/* Action Button */}
        {verificationStep !== "success" && (
          <button 
            onClick={handleVerification} 
            disabled={isLoading}
            className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {getButtonText()}
          </button>
        )}
      </div>

      {/* Features List */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border">
        <h3 className="font-semibold text-gray-900 mb-4">What you'll get access to:</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-gray-700">Decentralized marketplace</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-gray-700">Social trading features</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-700">Secure file storage</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span className="text-gray-700">Community interactions</span>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="text-xs text-gray-500 max-w-sm mx-auto">
        🔒 Your verification is secured by Reclaim Protocol. We never store your personal information.
      </div>
    </div>
  );
};

export default ReclaimVerification;