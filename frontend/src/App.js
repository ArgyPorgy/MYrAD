import React, { useState } from "react";
import LighthouseUpload from "./components/LighthouseUpload";
import ReclaimVerification from "./components/ReclaimVerification";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Feed from "./components/Feed";
import Marketplace from "./components/Marketplace";
import Profile from "./components/Profile";

function App() {
  const [isVerified, setIsVerified] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [activeTab, setActiveTab] = useState("feed");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Callback to pass to ReclaimVerification
  const handleVerificationSuccess = (wallet, proofs) => {
    setWalletAddress(wallet);
    setIsVerified(true);
    console.log("Proofs received:", proofs);
  };

  if (!isVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                MarketSocial
              </h1>
              <p className="text-gray-600">The future of social commerce</p>
            </div>
            <ReclaimVerification onSuccess={handleVerificationSuccess} />
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "feed":
        return (
          <Feed 
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
          />
        );
      case "marketplace":
        return (
          <Marketplace 
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
          />
        );
      case "upload":
        return (
          <div className="max-w-2xl mx-auto">
            <LighthouseUpload walletAddress={walletAddress} />
          </div>
        );
      case "profile":
        return <Profile walletAddress={walletAddress} />;
      default:
        return (
          <Feed 
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        walletAddress={walletAddress}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          <Sidebar 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />
          
          <div className="flex-1">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;