"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SearchIcon, Filter, MapPin, Loader2, XCircle } from "lucide-react"
import { PostCard } from "@/components/post-card"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import Link from "next/link" // 🎯 Added for navigation

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("recent")
  const [filterBy, setFilterBy] = useState("all")
  const [cityFilter, setCityFilter] = useState("all")

  // Fetch real data from Convex
  const posts = useQuery(api.posts.getFeed);

  // Get unique cities
  const availableCities = useMemo(() => {
    if (!posts) return [];
    const cities = [...new Set(posts.map((post) => post.city))].sort()
    return cities
  }, [posts])

  const filteredAndSortedPosts = useMemo(() => {
    if (!posts) return [];
    let filtered = [...posts];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (post) =>
          post.name?.toLowerCase().includes(query) ||
          post.city.toLowerCase().includes(query) ||
          post.text.toLowerCase().includes(query),
      )
    }

    if (cityFilter !== "all") {
      filtered = filtered.filter((post) => post.city === cityFilter)
    }

    if (filterBy !== "all") {
      filtered = filtered.filter((post) => {
        const total = post.greenFlags + post.redFlags
        const greenRatio = total > 0 ? post.greenFlags / total : 0
        switch (filterBy) {
          case "green-majority": return greenRatio > 0.6
          case "red-majority": return greenRatio < 0.4
          case "controversial": return greenRatio >= 0.4 && greenRatio <= 0.6 && total > 5
          default: return true
        }
      })
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "replies": return (b.repliesCount || 0) - (a.repliesCount || 0)
        case "red-flags": return b.redFlags - a.redFlags
        case "green-flags": return b.greenFlags - a.greenFlags
        case "recent":
        default: return b.createdAt - a.createdAt
      }
    })

    return filtered
  }, [posts, searchQuery, sortBy, filterBy, cityFilter])

  if (posts === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Loader2 className="animate-spin text-red-600" size={40} />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto text-white bg-transparent">
      <div className="mb-6 lg:mb-8 px-2">
        <h1 className="text-2xl lg:text-3xl font-bold mb-2">Search & Filter</h1>
        <p className="text-gray-400 text-sm lg:text-base">Find specific posts and filter by community feedback</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
        {/* Search Bar */}
        <Card className="lg:col-span-2 bg-gray-900/50 border-gray-800 rounded-2xl border-none shadow-xl">
          <CardHeader className="pb-3 lg:pb-4">
            <CardTitle className="flex items-center gap-2 text-white text-lg lg:text-xl font-bold">
              <SearchIcon size={20} className="text-red-600" />
              Search Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative group">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors group-focus-within:text-red-500" size={18} />
              <Input
                placeholder="Search name, city, or story..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-950 border-gray-800 text-white placeholder:text-gray-700 rounded-xl transition-all duration-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 focus:shadow-[0_0_20px_rgba(220,38,38,0.15)] h-11"
              />
            </div>
          </CardContent>
        </Card>

        {/* Location Selector */}
        <Card className="bg-gray-900/50 border-gray-800 rounded-2xl border-none shadow-xl">
          <CardHeader className="pb-3 lg:pb-4">
            <CardTitle className="flex items-center gap-2 text-white text-lg lg:text-xl font-bold">
              <MapPin size={20} className="text-red-600" />
              City
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="bg-gray-950 border-gray-800 rounded-xl text-white h-11">
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent className="bg-gray-950 border-gray-800 text-white">
                <SelectItem value="all">All Cities</SelectItem>
                {availableCities.map((city) => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Sorting/Filters */}
        <Card className="bg-gray-900/50 border-gray-800 rounded-2xl border-none shadow-xl">
          <CardHeader className="pb-3 lg:pb-4">
            <CardTitle className="flex items-center gap-2 text-white text-lg lg:text-xl font-bold">
              <Filter size={20} className="text-red-600" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="bg-gray-950 border-gray-800 rounded-xl text-sm text-white h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-950 border-gray-800 text-white">
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="replies">Most Replies</SelectItem>
                <SelectItem value="red-flags">Most Red Flags</SelectItem>
                <SelectItem value="green-flags">Most Green Flags</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="bg-gray-950 border-gray-800 rounded-xl text-sm text-white h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-950 border-gray-800 text-white">
                <SelectItem value="all">All Posts</SelectItem>
                <SelectItem value="green-majority">Green Flag Majority</SelectItem>
                <SelectItem value="red-majority">Red Flag Majority</SelectItem>
                <SelectItem value="controversial">Controversial</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Results Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-bold text-white">
            Search Results <span className="text-red-600 ml-1">({filteredAndSortedPosts.length})</span>
          </h2>
          {(searchQuery || cityFilter !== "all" || filterBy !== "all") && (
            <button
              onClick={() => { setSearchQuery(""); setCityFilter("all"); setFilterBy("all"); setSortBy("recent"); }}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
          {filteredAndSortedPosts.map((post) => (
            /* 🎯 Wrapped Card in Link for Navigation */
            <Link 
              key={post._id} 
              href={`/post/${post._id}`}
              className="block transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <PostCard 
                isProfileView={false}
                post={{
                  id: post._id,
                  userId: post.userId,
                  image: post.imageUrl || "/placeholder.svg",
                  name: post.name,
                  age: post.age,
                  city: post.city,
                  context: post.text,
                  greenFlags: post.greenFlags,
                  redFlags: post.redFlags,
                  replies: post.repliesCount || 0,
                  timestamp: "", 
                }} 
              />
            </Link>
          ))}
        </div>

        {filteredAndSortedPosts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-gray-900/20 rounded-3xl border border-dashed border-gray-800">
            <SearchIcon className="w-16 h-16 text-gray-800 mb-4" />
            <h3 className="text-lg lg:text-xl font-medium mb-2 text-white">No results found</h3>
            <p className="text-gray-400 text-sm">Try adjusting your search criteria or filters</p>
          </div>
        )}
      </div>
    </div>
  )
}