"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SearchIcon, Filter, MapPin, Loader2, XCircle } from "lucide-react"
import { PostCard } from "@/components/post-card"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("recent")
  const [filterBy, setFilterBy] = useState("all")
  const [cityFilter, setCityFilter] = useState("all")

  const posts = useQuery(api.posts.getFeed);

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
        <h1 className="text-2xl lg:text-3xl font-bold mb-1">Search & Filter</h1>
        <p className="text-gray-400 text-xs sm:text-sm">Find specific stories across the community</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
        {/* Search Bar */}
        <Card className="lg:col-span-2 bg-gray-900/50 border-gray-800 rounded-2xl border-none shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-gray-300 text-sm uppercase tracking-wider">
              <SearchIcon size={16} className="text-red-500" />
              Keyword Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <Input
                placeholder="Search name, city, or story..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-600 focus:border-red-500/50 rounded-xl"
              />
            </div>
          </CardContent>
        </Card>

        {/* City Filter */}
        <Card className="bg-gray-900/50 border-gray-800 rounded-2xl border-none shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-gray-300 text-sm uppercase tracking-wider">
              <MapPin size={16} className="text-red-500" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={cityFilter} onValueChange={setCityFilter}>
              {/* 🎯 Added text-white here */}
              <SelectTrigger className="bg-gray-800/50 border-gray-700 rounded-xl text-white">
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-800 text-white">
                <SelectItem value="all" className="focus:bg-red-600 focus:text-white">All Cities</SelectItem>
                {availableCities.map((city) => (
                  <SelectItem key={city} value={city} className="focus:bg-red-600 focus:text-white">
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Advanced Filters */}
        <Card className="bg-gray-900/50 border-gray-800 rounded-2xl border-none shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-gray-300 text-sm uppercase tracking-wider">
              <Filter size={16} className="text-red-500" />
              Sort & Filter
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              {/* 🎯 Added text-white here */}
              <SelectTrigger className="bg-gray-800/50 border-gray-700 rounded-xl text-xs text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-800 text-white">
                <SelectItem value="recent" className="focus:bg-red-600 focus:text-white">Recent</SelectItem>
                <SelectItem value="replies" className="focus:bg-red-600 focus:text-white">Replies</SelectItem>
                <SelectItem value="red-flags" className="focus:bg-red-600 focus:text-white">Red Flags</SelectItem>
                <SelectItem value="green-flags" className="focus:bg-red-600 focus:text-white">Green Flags</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterBy} onValueChange={setFilterBy}>
              {/* 🎯 Added text-white here */}
              <SelectTrigger className="bg-gray-800/50 border-gray-700 rounded-xl text-xs text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-800 text-white">
                <SelectItem value="all" className="focus:bg-red-600 focus:text-white">All Flags</SelectItem>
                <SelectItem value="green-majority" className="focus:bg-red-600 focus:text-white">Green Majority</SelectItem>
                <SelectItem value="red-majority" className="focus:bg-red-600 focus:text-white">Red Majority</SelectItem>
                <SelectItem value="controversial" className="focus:bg-red-600 focus:text-white">Controversial</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Results Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-bold uppercase tracking-tight">
            Results <span className="text-red-500 ml-1">({filteredAndSortedPosts.length})</span>
          </h2>
          {(searchQuery || cityFilter !== "all" || filterBy !== "all") && (
            <button
              onClick={() => {
                setSearchQuery(""); setCityFilter("all"); setFilterBy("all"); setSortBy("recent");
              }}
              className="text-[10px] tracking-widest text-red-500 hover:text-red-400 flex items-center gap-1 font-black"
            >
              <XCircle size={14} /> CLEAR FILTERS
            </button>
          )}
        </div>

        {filteredAndSortedPosts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {filteredAndSortedPosts.map((post) => (
              <PostCard 
                key={post._id} 
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
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-gray-900/20 rounded-3xl border border-dashed border-gray-800">
            <SearchIcon className="w-16 h-16 text-gray-800 mb-4" />
            <h3 className="text-xl font-medium text-gray-500 italic">No matches found</h3>
          </div>
        )}
      </div>
    </div>
  )
}