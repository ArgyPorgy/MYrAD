import React, { useState } from "react";
import { Heart, MessageCircle, Share2, Shield, MoreHorizontal, Bookmark, Filter, Grid, List, Star } from "lucide-react";

const Feed = ({ searchQuery, selectedCategory }) => {
  const [viewMode, setViewMode] = useState("grid");
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [bookmarkedPosts, setBookmarkedPosts] = useState(new Set());

  const mockPosts = [
    {
      id: 1,
      user: { 
        name: "DataCorp Analytics", 
        avatar: "🏢", 
        verified: true,
        followers: "5.2k",
        badge: "Premium Provider"
      },
      content: "🔥 HOT: ICICI Bank Customer Transaction Dataset now available! 50K+ transactions from 2023 with fraud detection patterns, customer demographics, and risk scores. Perfect for fintech research and ML models!",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop",
      likes: 156,
      comments: 23,
      shares: 8,
      price: "15 DTT",
      category: "Banking",
      timestamp: "2 hours ago",
      tags: ["#Banking", "#FraudDetection", "#CustomerData", "#ICICI"],
      dataset: {
        size: "2.3GB",
        records: "52,847",
        format: "CSV"
      }
    },
    {
      id: 2,
      user: { 
        name: "FoodTech Insights", 
        avatar: "🍕", 
        verified: true,
        followers: "3.8k",
        badge: "Top Seller"
      },
      content: "📊 Zomato Users & Restaurant Dataset - 100K+ users, 10K+ restaurants across major Indian cities! Includes order history, ratings, cuisine preferences, delivery patterns. Essential for foodtech startups!",
      image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop",
      likes: 89,
      comments: 17,
      shares: 12,
      price: "12 DTT",
      category: "FoodTech",
      timestamp: "4 hours ago",
      tags: ["#FoodTech", "#Zomato", "#UserBehavior", "#RestaurantData"],
      dataset: {
        size: "1.8GB",
        records: "125,432",
        format: "JSON"
      }
    },
    {
      id: 3,
      user: { 
        name: "CodeMetrics Pro", 
        avatar: "👨‍💻", 
        verified: true,
        followers: "7.1k",
        badge: "Developer Choice"
      },
      content: "💻 GitHub Repository Analytics Dataset - 500K+ repos with commit history, language distribution, contributor data! Perfect for understanding software development trends and patterns.",
      image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=300&fit=crop",
      likes: 203,
      comments: 31,
      shares: 15,
      price: "25 DTT",
      category: "Development",
      timestamp: "6 hours ago",
      tags: ["#GitHub", "#CodeAnalytics", "#Development", "#Repositories"],
      dataset: {
        size: "4.1GB",
        records: "487,293",
        format: "Parquet"
      }
    },
    {
      id: 4,
      user: { 
        name: "PayTech Solutions", 
        avatar: "💳", 
        verified: true,
        followers: "4.5k",
        badge: "Financial Expert"
      },
      content: "💸 Paytm Digital Wallet Dataset - 200K+ users with transaction patterns, merchant categories, recharge history! Great for building fintech apps and understanding digital payment behaviors.",
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop",
      likes: 127,
      comments: 19,
      shares: 9,
      price: "18 DTT",
      category: "FinTech",
      timestamp: "1 day ago",
      tags: ["#Paytm", "#DigitalWallet", "#FinTech", "#Payments"],
      dataset: {
        size: "3.2GB",
        records: "198,765",
        format: "CSV"
      }
    },
    {
      id: 5,
      user: { 
        name: "E-commerce Insights", 
        avatar: "🛒", 
        verified: false,
        followers: "2.3k",
        badge: "Rising Star"
      },
      content: "🛍️ Amazon Product Reviews & Sales Dataset - 75K+ products with reviews, ratings, sales data, customer sentiment! Perfect for building recommendation systems and understanding e-commerce trends.",
      image: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&h=300&fit=crop",
      likes: 94,
      comments: 14,
      shares: 6,
      price: "14 DTT",
      category: "E-commerce",
      timestamp: "2 days ago",
      tags: ["#Amazon", "#Reviews", "#E-commerce", "#Recommendations"],
      dataset: {
        size: "2.7GB",
        records: "89,432",
        format: "JSON"
      }
    },
    {
      id: 6,
      user: { 
        name: "HealthData Pro", 
        avatar: "🏥", 
        verified: true,
        followers: "6.8k",
        badge: "Medical Expert"
      },
      content: "🏥 Apollo Hospitals Patient Records Dataset - Anonymized data from 30K+ patients including diagnosis, treatment history, outcomes. Essential for healthcare analytics and medical research!",
      image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=300&fit=crop",
      likes: 178,
      comments: 26,
      shares: 11,
      price: "22 DTT",
      category: "Healthcare",
      timestamp: "3 days ago",
      tags: ["#Healthcare", "#MedicalData", "#PatientRecords", "#Apollo"],
      dataset: {
        size: "1.9GB",
        records: "34,567",
        format: "CSV"
      }
    },
    {
      id: 7,
      user: { 
        name: "TravelTech Data", 
        avatar: "✈️", 
        verified: true,
        followers: "3.2k",
        badge: "Travel Expert"
      },
      content: "✈️ MakeMyTrip Booking Dataset - Flight and hotel bookings with pricing, seasonal trends, user preferences! Great for travel industry analysis and pricing optimization strategies.",
      image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop",
      likes: 76,
      comments: 12,
      shares: 4,
      price: "16 DTT",
      category: "Travel",
      timestamp: "4 days ago",
      tags: ["#Travel", "#MakeMyTrip", "#BookingData", "#Pricing"],
      dataset: {
        size: "2.1GB",
        records: "67,234",
        format: "CSV"
      }
    },
    {
      id: 8,
      user: { 
        name: "EdTech Analytics", 
        avatar: "📚", 
        verified: false,
        followers: "1.9k",
        badge: "Education Specialist"
      },
      content: "📚 BYJU'S Learning Patterns Dataset - Student performance, course completion rates, engagement metrics! Perfect for educational technology research and personalized learning algorithms.",
      image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop",
      likes: 58,
      comments: 9,
      shares: 3,
      price: "13 DTT",
      category: "Education",
      timestamp: "5 days ago",
      tags: ["#Education", "#BYJUS", "#LearningAnalytics", "#EdTech"],
      dataset: {
        size: "1.5GB",
        records: "45,678",
        format: "JSON"
      }
    }
  ];

  const filteredPosts = mockPosts.filter(post => {
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    const matchesSearch = post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleLike = (postId) => {
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const handleBookmark = (postId) => {
    setBookmarkedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const PostCard = ({ post }) => (
    <div className="bg-white rounded-2xl shadow-sm border hover:shadow-lg transition-all duration-300">
      {/* Post Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{post.user.avatar}</div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h4 className="font-semibold text-gray-900">{post.user.name}</h4>
                {post.user.verified && (
                  <Shield className="w-4 h-4 text-blue-500" />
                )}
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  {post.user.badge}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>{post.user.followers} followers</span>
                <span>•</span>
                <span>{post.timestamp}</span>
              </div>
            </div>
          </div>
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Post Image */}
      <div className="relative">
        <img 
          src={post.image} 
          alt="Post content"
          className="w-full h-64 object-cover"
        />
        <div className="absolute top-3 left-3">
          <span className="bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium shadow-sm">
            {post.category}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
            {post.price}
          </span>
        </div>
        <button
          onClick={() => handleBookmark(post.id)}
          className={`absolute bottom-3 right-3 p-2 rounded-full transition-colors ${
            bookmarkedPosts.has(post.id)
              ? 'bg-yellow-500 text-white'
              : 'bg-white/95 text-gray-600 hover:bg-yellow-500 hover:text-white'
          }`}
        >
          <Bookmark className="w-4 h-4" />
        </button>
      </div>

      {/* Post Content */}
      <div className="p-4">
        <p className="text-gray-700 mb-3 leading-relaxed">{post.content}</p>
        
        {/* Dataset Info */}
        {post.dataset && (
          <div className="bg-gray-50 rounded-lg p-3 mb-3">
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="text-center">
                <div className="font-semibold text-gray-900">{post.dataset.size}</div>
                <div className="text-gray-600">Size</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-900">{post.dataset.records}</div>
                <div className="text-gray-600">Records</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-900">{post.dataset.format}</div>
                <div className="text-gray-600">Format</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map(tag => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full hover:bg-blue-100 hover:text-blue-600 cursor-pointer transition-colors">
              {tag}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-6">
            <button 
              onClick={() => handleLike(post.id)}
              className={`flex items-center space-x-2 transition-colors ${
                likedPosts.has(post.id)
                  ? 'text-red-500'
                  : 'text-gray-600 hover:text-red-500'
              }`}
            >
              <Heart className={`w-5 h-5 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} />
              <span className="font-medium">{post.likes + (likedPosts.has(post.id) ? 1 : 0)}</span>
            </button>
            <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-500 transition-colors">
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium">{post.comments}</span>
            </button>
            <button className="flex items-center space-x-2 text-gray-600 hover:text-green-500 transition-colors">
              <Share2 className="w-5 h-5" />
              <span className="font-medium">{post.shares}</span>
            </button>
          </div>
          <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg">
            Buy Dataset
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Controls Header */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">Social Feed</h2>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {filteredPosts.length} posts
            </span>
            {selectedCategory !== "All" && (
              <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                #{selectedCategory}
              </span>
            )}
          </div>
          
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
        </div>
      </div>

      {/* Posts */}
      {filteredPosts.length > 0 ? (
        <div className={
          viewMode === "grid" 
            ? "grid grid-cols-1 lg:grid-cols-2 gap-6" 
            : "space-y-6"
        }>
          {filteredPosts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts found</h3>
          <p className="text-gray-600 max-w-sm mx-auto">
            {searchQuery || selectedCategory !== "All" 
              ? "Try adjusting your search or filters to find more posts."
              : "Be the first to share something with the community!"
            }
          </p>
          <button className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 transition-colors">
            Create Post
          </button>
        </div>
      )}
    </>
  );
};

export default Feed;