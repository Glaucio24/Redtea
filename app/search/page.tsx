"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SearchIcon, Filter, MapPin, Loader2, Check } from "lucide-react"
import { PostCard } from "@/components/post-card"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import Link from "next/link"
import { US_CITIES } from "@/lib/constants"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { cn } from "@/lib/utils"

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("recent")
  const [filterBy, setFilterBy] = useState("all")
  const [cityFilter, setCityFilter] = useState("all")
  const [open, setOpen] = useState(false)

  const posts = useQuery(api.posts.getFeed);

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
        <p className="text-gray-400 text-sm lg:text-base font-medium">Find specific posts and filter by community feedback</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
        <Card className="lg:col-span-2 bg-gray-950 border-gray-800 rounded-2xl border-none shadow-xl">
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
                className="pl-10 bg-gray-800 border-gray-800 text-white placeholder:text-gray-300 rounded-xl focus:border-red-600 h-11"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-950 border-gray-800 rounded-2xl border-none shadow-xl">
          <CardHeader className="pb-3 lg:pb-4">
            <CardTitle className="flex items-center gap-2 text-white text-lg lg:text-xl font-bold">
              <MapPin size={20} className="text-red-600" />
              City
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <button className="w-full flex items-center justify-between bg-gray-800 border-none px-4 py-2.5 rounded-xl text-sm text-white h-11">
                  {cityFilter === "all" ? "All Cities" : cityFilter}
                  <MapPin className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[250px] p-0 bg-gray-900 border-gray-800">
                <Command className="bg-gray-900">
                  <CommandInput placeholder="Search US City..." className="text-white" />
                  <CommandEmpty>No city found.</CommandEmpty>
                  <CommandGroup className="max-h-60 overflow-y-auto custom-scrollbar">
                    <CommandItem
                      value="all"
                      onSelect={() => { setCityFilter("all"); setOpen(false); }}
                      className="text-white hover:bg-red-600"
                    >
                      All Cities
                    </CommandItem>
                    {US_CITIES.map((city) => (
                      <CommandItem
                        key={city}
                        value={city}
                        onSelect={(currentValue) => {
                          setCityFilter(currentValue === cityFilter ? "all" : city)
                          setOpen(false)
                        }}
                        className="text-white hover:bg-red-600"
                      >
                        <Check className={cn("mr-2 h-4 w-4", cityFilter === city ? "opacity-100" : "opacity-0")} />
                        {city}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>

        <Card className="bg-gray-950 border-gray-800 rounded-2xl border-none shadow-xl">
          <CardHeader className="pb-3 lg:pb-4">
            <CardTitle className="flex items-center gap-2 text-white text-lg lg:text-xl font-bold">
              <Filter size={20} className="text-red-600" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="bg-gray-800 border-gray-800 rounded-xl text-sm text-white h-10">
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
              <SelectTrigger className="bg-gray-800 border-gray-800 rounded-xl text-sm text-white h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-950 border-gray-800 text-white">
                <SelectItem value="all">All Posts</SelectItem>
                <SelectItem value="green-majority">Green Flag Majority</SelectItem>
                <SelectItem value="red-majority">Red Flag Majority</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-bold text-white">
            Search Results <span className="text-red-600 ml-1">({filteredAndSortedPosts.length})</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {filteredAndSortedPosts.map((post) => (
            <Link key={post._id} href={`/post/${post._id}`} className="block transition-transform hover:scale-[1.02]">
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
      </div>
    </div>
  )
}