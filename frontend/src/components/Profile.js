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
  MoreHorizontal
} from "lucide-react";

const Profile = ({ walletAddress }) => {
  const [activeTab, setActiveTab] = useState("listings");
  const [viewMode, setViewMode] = useState("grid");
  const [isEditing, setIsEditing] = useState(false);

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
      reviews: 127
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
            <button className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors flex items-center space-x-2">
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
            <button className="bg-white/20 backdrop-blur-sm text-white p-2 rounded-lg hover:bg-white/30 transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats and Badges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border">
          <h3 className="font-semibold text-gray-900 mb-4">Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <div className="text-2xl font-bold text-blue-600">{userProfile.stats.listings}</div>
              <div className="text-sm text-blue-600">Active Listings</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <div className="text-2xl font-bold text-green-600">{userProfile.stats.sold}</div>
              <div className="text-sm text-green-600">Items Sold</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <div className="text-2xl font-bold text-purple-600">{userProfile.stats.followers}</div>
              <div className="text-sm text-purple-600">Followers</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-xl">
              <div className="text-2xl font-bold text-orange-600">{userProfile.stats.totalEarnings}</div>
              <div className="text-sm text-orange-600">Total Earnings</div>
            </div>
          </div>

          {/* Rating */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(userProfile.stats.rating)
                          ? 'text-yellow-500 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-semibold text-gray-900">
                  {userProfile.stats.rating} ({userProfile.stats.reviews} reviews)
                </span>
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
          </div>
        </div>

        {/* Badges and Achievements */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <h3 className="font-semibold text-gray-900 mb-4">Achievements</h3>
          <div className="space-y-3">
            {userProfile.badges.map((badge, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <Award className="w-5 h-5 text-blue-500" />
                <span className="font-medium text-gray-900">{badge}</span>
              </div>
            ))}
          </div>

          {/* Wallet Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Connected Wallet</h4>
            <p className="text-sm text-gray-600 font-mono break-all">{walletAddress}</p>
            <div className="flex items-center space-x-2 mt-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-xs text-green-600">Connected</span>
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

          {activeTab === "activity" && (
            <div className="space-y-4">
              {[
                { action: "Listed", item: "Cyberpunk City #001", time: "2 hours ago", type: "listing" },
                { action: "Sold", item: "Digital Dreams Collection", time: "1 day ago", type: "sale" },
                { action: "Liked", item: "Abstract Ocean Painting", time: "2 days ago", type: "like" },
                { action: "Followed", item: "Sarah Kim", time: "3 days ago", type: "follow" }
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'sale' ? 'bg-green-500' :
                    activity.type === 'listing' ? 'bg-blue-500' :
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
  );
};

export default Profile;