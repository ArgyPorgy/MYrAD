import React from "react";
import { Grid, ShoppingBag, Upload, User, TrendingUp, Hash, Users } from "lucide-react";

const Sidebar = ({ activeTab, setActiveTab, selectedCategory, setSelectedCategory }) => {
  const mockCategories = [
    { name: "All", icon: Grid, count: 256 },
    { name: "Banking", icon: Hash, count: 32 },
    { name: "FoodTech", icon: TrendingUp, count: 28 },
    { name: "Development", icon: Users, count: 45 },
    { name: "FinTech", icon: Hash, count: 38 },
    { name: "E-commerce", icon: Grid, count: 42 },
    { name: "Healthcare", icon: Grid, count: 25 },
    { name: "Travel", icon: Grid, count: 18 },
    { name: "Education", icon: Grid, count: 28 }
  ];

  const navigationItems = [
    { id: "feed", label: "Feed", icon: Grid, description: "Latest dataset posts" },
    { id: "marketplace", label: "Marketplace", icon: ShoppingBag, description: "Browse datasets" },
    { id: "upload", label: "Upload", icon: Upload, description: "Upload datasets" },
    { id: "profile", label: "Profile", icon: User, description: "Your profile settings" }
  ];

  return (
    <div className="w-64 space-y-6">
      {/* Navigation */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border">
        <h2 className="font-semibold text-gray-900 mb-4">Navigation</h2>
        <nav className="space-y-2">
          {navigationItems.map(({ id, label, icon: Icon, description }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                activeTab === id 
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg" 
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Icon className={`w-5 h-5 ${activeTab === id ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`} />
              <div className="flex-1 text-left">
                <div className="font-medium">{label}</div>
                <div className={`text-xs ${activeTab === id ? 'text-white/80' : 'text-gray-400'}`}>
                  {description}
                </div>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Categories */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border">
        <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
        <div className="space-y-1">
          {mockCategories.map(({ name, icon: Icon, count }) => (
            <button
              key={name}
              onClick={() => setSelectedCategory(name)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors group ${
                selectedCategory === name
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center space-x-2">
                <Icon className={`w-4 h-4 ${
                  selectedCategory === name ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                }`} />
                <span className="font-medium">{name}</span>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                selectedCategory === name 
                  ? 'bg-blue-200 text-blue-800' 
                  : 'bg-gray-200 text-gray-600 group-hover:bg-gray-300'
              }`}>
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-4 text-white">
        <h3 className="font-semibold mb-3">Your Activity</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-white/80">Datasets Listed</span>
            <span className="font-bold">12</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/80">Total Sales</span>
            <span className="font-bold">8</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/80">Followers</span>
            <span className="font-bold">147</span>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-white/20">
          <div className="text-xs text-white/70">
            🔥 You're in the top 10% of data providers this week!
          </div>
        </div>
      </div>

      {/* Trending Topics */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border">
        <h3 className="font-semibold text-gray-900 mb-4">Trending Datasets</h3>
        <div className="space-y-3">
          {[
            { tag: "#Banking", posts: "2.1k datasets" },
            { tag: "#FoodTech", posts: "847 datasets" },
            { tag: "#GitHub", posts: "1.3k datasets" },
            { tag: "#Paytm", posts: "924 datasets" }
          ].map(({ tag, posts }, index) => (
            <div key={tag} className="flex items-center justify-between">
              <div>
                <div className="font-medium text-blue-600 text-sm">{tag}</div>
                <div className="text-xs text-gray-500">{posts}</div>
              </div>
              <div className="text-xs text-gray-400">#{index + 1}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;