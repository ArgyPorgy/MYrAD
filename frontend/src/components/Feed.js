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
        name: "Alex Chen", 
        avatar: "👨‍💼", 
        verified: true,
        followers: "2.1k",
        badge: "Top Seller"
      },
      content: "Just listed my NFT collection! Check out these amazing digital artworks 🎨 Each piece tells a unique story and represents hours of creative work.",
      image: "https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=400&h=300&fit=crop",
      likes: 24,
      comments: 8,
      shares: 3,
      price: "0.5 ETH",
      category: "NFT",
      timestamp: "2 hours ago",
      tags: ["#DigitalArt", "#NFT", "#Crypto"]
    },
    {
      id: 2,
      user: { 
        name: "Sarah Kim", 
        avatar: "👩‍🎨", 
        verified: true,
        followers: "1.8k",
        badge: "Artist"
      },
      content: "New vintage camera collection available! Perfect for photography enthusiasts 📸 These beauties have been carefully restored and tested.",
      image: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=300&fit=crop",
      likes: 18,
      comments: 12,
      shares: 5,
      price: "$299",
      category: "Electronics",
      timestamp: "4 hours ago",
      tags: ["#VintageItems", "#Photography", "#Cameras"]
    },
    {
      id: 3,
      user: { 
        name: "Mike Johnson", 
        avatar: "👨‍🚀", 
        verified: false,
        followers: "892",
        badge: "Craftsman"
      },
      content: "Handcrafted wooden furniture pieces. Each item is unique and made with sustainable materials 🌱 Custom orders welcome!",
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop",
      likes: 31,
      comments: 6,
      shares: 8,
      price: "$450",
      category: "Furniture",
      timestamp: "1 day ago",
      tags: ["#Handmade", "#Sustainable", "#Furniture"]
    },
    {
      id: 4,
      user: { 
        name: "Emma Davis", 
        avatar: "👩‍🎨", 
        verified: true,
        followers: "3.2k",
        badge: "Featured Artist"
      },
      content: "Abstract painting series inspired by ocean waves 🌊 Mixed media on canvas, ready to ship worldwide!",
      image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop",
      likes: 67,
      comments: 23,
      shares: 12,
      price: "$850",
      category: "Art",
      timestamp: "6 hours ago",
      tags: ["#AbstractArt", "#Painting", "#Ocean"]
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
            Buy Now
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