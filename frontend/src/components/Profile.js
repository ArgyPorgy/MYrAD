import React, { useState } from "react";
import { 
  User, 
  Settings, 
  Edit3, 
  Star, 
  ShoppingBag, 
  Heart, 
  Eye, 
  Award, 
  Calendar, 
  MapPin, 
  Link as LinkIcon, 
  Mail, 
  Shield,
  TrendingUp,
  Grid,
  List,
  Filter,
  Share2,
  MoreHorizontal,
  Copy,
  X,
  Users,
  Gift
} from "lucide-react";

const Profile = ({ walletAddress }) => {
  const [activeTab, setActiveTab] = useState("listings");
  const [viewMode, setViewMode] = useState("grid");
  const [isEditing, setIsEditing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Generate referral code from wallet address
  const generateReferralCode = (walletAddress) => {
    if (!walletAddress) return "DEMO123";
    return walletAddress.slice(-6).toUpperCase();
  };

  const referralCode = generateReferralCode(walletAddress);
  const referralLink = `${window.location.origin}/signup?ref=${referralCode}`;

  // Mock user profile data
  const userProfile = {
    name: "Alex Chen",
    username: "@alexchen",
    avatar: "👨‍💼",
    bio: "Digital artist and NFT creator passionate about blockchain technology. Creating unique digital experiences that bridge art and technology.",
    location: "San Francisco, CA",
    website: "alexchen.art",
    email: "alex@alexchen.art",
    joinDate: "March 2023",
    verified: true,
    badges: ["Top Seller", "Verified Artist", "Early Adopter"],
    stats: {
      listings: 23,
      sold: 15,
      followers: 2143,
      following: 458,
      totalEarnings: "12.5 ETH",
      rating: 4.9,
      reviews: 127,
      referrals: 47, // New stat for referrals
      referralEarnings: "2.3 ETH" // New stat for referral earnings
    },
    socialLinks: {
      twitter: "@alexchen_art",
      instagram: "@alexchen.creates",
      discord: "alexchen#1234"
    }
  };

  // Mock listings data
  const userListings = [
    {
      id: 1,
      title: "Cyberpunk City #001",
      image: "https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=300&h=300&fit=crop",
      price: "0.5 ETH",
      status: "active",
      views: 342,
      likes: 24,
      category: "NFT"
    },
    {
      id: 2,
      title: "Digital Dreams Collection",
      image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&h=300&fit=crop",
      price: "1.2 ETH",
      status: "sold",
      views: 521,
      likes: 67,
      category: "NFT"
    },
    {
      id: 3,
      title: "Abstract Geometry Art",
      image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=300&h=300&fit=crop",
      price: "0.8 ETH",
      status: "active",
      views: 198,
      likes: 31,
      category: "Art"
    },
    {
      id: 4,
      title: "Vintage Tech Poster",
      image: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=300&h=300&fit=crop",
      price: "0.3 ETH",
      status: "pending",
      views: 89,
      likes: 12,
      category: "Design"
    }
  ];

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
    alert("✅ Copied to clipboard!");
  };

  const ShareModal = () => {
    if (!showShareModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 w-full max-w-md">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Share Profile & Earn</h3>
            <button
              onClick={() => setShowShareModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Referral Stats */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 mb-6 border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Gift className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-gray-900">Referral Program</h4>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">{userProfile.stats.referrals}</p>
                <p className="text-sm text-gray-600">People Referred</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{userProfile.stats.referralEarnings}</p>
                <p className="text-sm text-gray-600">Earned from Referrals</p>
              </div>
            </div>
          </div>

          {/* Referral Code */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Referral Code
            </label>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-100 rounded-lg p-3 font-mono text-center text-lg font-bold text-blue-600">
                {referralCode}
              </div>
              <button
                onClick={() => copyToClipboard(referralCode)}
                className="bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Referral Link */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Referral Link
            </label>
            <div className="bg-gray-50 rounded-lg p-3 border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 truncate pr-2">
                  {referralLink}
                </span>
                <button
                  onClick={() => copyToClipboard(referralLink)}
                  className="text-blue-500 hover:text-blue-700 transition-colors flex-shrink-0"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* How it Works */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-blue-900 mb-2">How Referrals Work</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Share your referral link with friends</li>
              <li>• Earn 5% commission on their first purchase</li>
              <li>• Get bonus rewards for every 10 referrals</li>
              <li>• No limit on earnings!</li>
            </ul>
          </div>

          {/* Social Share Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                const text = `Check out this amazing marketplace! Join using my referral link: ${referralLink}`;
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
              }}
              className="bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
            >
              <span>🐦</span>
              <span>Tweet</span>
            </button>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'Join the Marketplace',
                    text: 'Check out this amazing marketplace!',
                    url: referralLink
                  });
                } else {
                  copyToClipboard(referralLink);
                }
              }}
              className="bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ProfileCard = ({ listing }) => (
    <div className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-all duration-300">
      <div className="relative">
        <img 
          src={listing.image} 
          alt={listing.title}
          className="w-full h-48 object-cover rounded-t-xl"
        />
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            listing.status === 'active' ? 'bg-green-100 text-green-700' :
            listing.status === 'sold' ? 'bg-red-100 text-red-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="bg-white/95 backdrop-blur-sm px-2 py-1 rounded-full text-sm font-bold">
            {listing.price}
          </span>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2">{listing.title}</h3>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <Eye className="w-4 h-4" />
              <span>{listing.views}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Heart className="w-4 h-4" />
              <span>{listing.likes}</span>
            </span>
          </div>
          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
            {listing.category}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 bg-white/20 rounded-2xl flex items-center justify-center text-4xl backdrop-blur-sm">
                  {userProfile.avatar}
                </div>
                {userProfile.verified && (
                  <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1">
                    <Shield className="w-4 h-4 text-blue-500" />
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold">{userProfile.name}</h1>
                  {userProfile.verified && (
                    <Shield className="w-6 h-6 text-white" />
                  )}
                </div>
                <p className="text-lg opacity-90 mb-3">{userProfile.username}</p>
                <p className="opacity-80 max-w-lg leading-relaxed">{userProfile.bio}</p>
                
                {/* Profile Details */}
                <div className="flex items-center space-x-6 mt-4 text-sm opacity-80">
                  <span className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>{userProfile.location}</span>
                  </span>
                  <span className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {userProfile.joinDate}</span>
                  </span>
                  <span className="flex items-center space-x-2">
                    <LinkIcon className="w-4 h-4" />
                    <span>{userProfile.website}</span>
                  </span>
                  <span className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>{userProfile.stats.referrals} referred</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors flex items-center space-x-2"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
              <button 
                onClick={() => setShowShareModal(true)}
                className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors flex items-center space-x-2"
              >
                <Share2 className="w-4 h-4" />
                <span>Share & Earn</span>
              </button>
              <button className="bg-white/20 backdrop-blur-sm text-white p-2 rounded-lg hover:bg-white/30 transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <h3 className="font-semibold text-gray-900 mb-4">Browse Datasets by Category</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Zomato", icon: "🍕", color: "bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100" },
              { name: "Paytm", icon: "💳", color: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100" },
              { name: "GitHub", icon: "👨‍💻", color: "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100" },
              { name: "ICICI Bank", icon: "🏦", color: "bg-green-50 border-green-200 text-green-700 hover:bg-green-100" },
              { name: "Amazon", icon: "🛒", color: "bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100" },
              { name: "Apollo", icon: "🏥", color: "bg-red-50 border-red-200 text-red-700 hover:bg-red-100" },
              { name: "MakeMyTrip", icon: "✈️", color: "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100" },
              { name: "BYJU'S", icon: "📚", color: "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100" }
            ].map((category, index) => (
              <button
                key={index}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${category.color}`}
                onClick={() => {
                  console.log(`Filtering by ${category.name}`);
                }}
              >
                <div className="text-2xl mb-2">{category.icon}</div>
                <div className="font-medium">{category.name}</div>
              </button>
            ))}
          </div>
          
          {/* Wallet Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Connected Wallet</h4>
            <p className="text-sm text-gray-600 font-mono break-all">{walletAddress}</p>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-xs text-green-600">Connected</span>
              </div>
              <div className="text-xs text-gray-500">
                Referral Code: <span className="font-mono font-bold text-blue-600">{referralCode}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border">
          {/* Tab Headers */}
          <div className="border-b border-gray-200">
            <div className="flex items-center justify-between p-6">
              <div className="flex space-x-1">
                {[
                  { id: "listings", label: "My Listings", count: userListings.length },
                  { id: "sold", label: "Sold Items", count: userProfile.stats.sold },
                  { id: "favorites", label: "Favorites", count: 8 },
                  { id: "referrals", label: "Referrals", count: userProfile.stats.referrals },
                  { id: "activity", label: "Activity", count: null }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.count !== null && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        activeTab === tab.id ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* View Controls */}
              {activeTab === "listings" && (
                <div className="flex items-center space-x-2">
                  <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <Filter className="w-4 h-4" />
                    <span className="hidden sm:inline">Filter</span>
                  </button>
                  <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 transition-colors ${
                        viewMode === "grid"
                          ? "bg-blue-500 text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 transition-colors ${
                        viewMode === "list"
                          ? "bg-blue-500 text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "listings" && (
              <div className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-4"
              }>
                {userListings.map(listing => (
                  <ProfileCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}

            {activeTab === "sold" && (
              <div className="text-center py-12">
                <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Sold Items</h3>
                <p className="text-gray-600">You have successfully sold {userProfile.stats.sold} items</p>
              </div>
            )}

            {activeTab === "favorites" && (
              <div className="text-center py-12">
                <Heart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Your Favorites</h3>
                <p className="text-gray-600">Items you've liked will appear here</p>
              </div>
            )}

            {activeTab === "referrals" && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Referral Dashboard</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-600">{userProfile.stats.referrals}</p>
                      <p className="text-gray-600">People Referred</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-blue-600">{userProfile.stats.referralEarnings}</p>
                      <p className="text-gray-600">Total Earnings</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-purple-600">5%</p>
                      <p className="text-gray-600">Commission Rate</p>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={() => setShowShareModal(true)}
                      className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                    >
                      <Share2 className="w-5 h-5" />
                      <span>Share Referral Link</span>
                    </button>
                  </div>
                </div>

                {/* Recent Referrals */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Referrals</h4>
                  <div className="space-y-3">
                    {[
                      { name: "Sarah M.", earnings: "0.25 ETH", date: "2 days ago" },
                      { name: "John D.", earnings: "0.15 ETH", date: "1 week ago" },
                      { name: "Maria K.", earnings: "0.30 ETH", date: "2 weeks ago" }
                    ].map((referral, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{referral.name}</p>
                          <p className="text-sm text-gray-600">{referral.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">+{referral.earnings}</p>
                          <p className="text-xs text-gray-500">Commission</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "activity" && (
              <div className="space-y-4">
                {[
                  { action: "Listed", item: "Cyberpunk City #001", time: "2 hours ago", type: "listing" },
                  { action: "Sold", item: "Digital Dreams Collection", time: "1 day ago", type: "sale" },
                  { action: "Referred", item: "Sarah M.", time: "2 days ago", type: "referral" },
                  { action: "Liked", item: "Abstract Ocean Painting", time: "2 days ago", type: "like" },
                  { action: "Followed", item: "Sarah Kim", time: "3 days ago", type: "follow" }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'sale' ? 'bg-green-500' :
                      activity.type === 'listing' ? 'bg-blue-500' :
                      activity.type === 'referral' ? 'bg-purple-500' :
                      activity.type === 'like' ? 'bg-red-500' :
                      'bg-purple-500'
                    }`}></div>
                    <div className="flex-1">
                      <span className="text-gray-900">{activity.action}</span>
                      <span className="text-gray-600"> {activity.item}</span>
                    </div>
                    <span className="text-sm text-gray-500">{activity.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal />
    </>
  );
};

export default Profile;
