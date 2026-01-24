"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Upload, Loader2, X, Image as ImageIcon, MapPin, Check } from "lucide-react";
import { US_CITIES } from "@/lib/constants"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { cn } from "@/lib/utils"

export default function SubmitPostPage() {
  const router = useRouter();
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const createPost = useMutation(api.posts.createPost);

  const [subjectName, setSubjectName] = useState("");
  const [text, setText] = useState("");
  const [age, setAge] = useState("");
  const [city, setCity] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text || !age || !city || !selectedImage) {
      alert("Please fill in all fields and upload an image.");
      return;
    }

    setIsSubmitting(true);
    try {
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": selectedImage.type },
        body: selectedImage,
      });
      const { storageId } = await result.json();

      await createPost({
        name: subjectName,
        text,
        age: parseInt(age),
        city,
        fileId: storageId,
      });

      router.push("/communityFeed");
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 lg:p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Spill the Tea</h1>
      
      <Card className="bg-gray-950 border-gray-800 p-6 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6">

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Who are we talking about?</label>
            <Input
              placeholder="Full Name"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white h-12 rounded-xl"
            />
          </div>

          {/* Image Area (Same as yours) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Photo</label>
            <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={(e) => setSelectedImage(e.target.files?.[0] || null)} />
            <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed rounded-2xl p-8 bg-gray-800/30 border-gray-800 cursor-pointer">
              {!selectedImage ? <Upload className="mx-auto text-gray-500" /> : <p className="text-green-500 text-center">{selectedImage.name}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Age</label>
              <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="bg-gray-800 border-gray-700 text-white h-12" />
            </div>

            {/* 🎯 SEARCHABLE CITY PICKER */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">City</label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between bg-gray-800 border-gray-700 text-white h-12 rounded-xl">
                    {city || "Select City"}
                    <MapPin className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0 bg-gray-900 border-gray-800">
                  <Command className="bg-gray-900">
                    <CommandInput placeholder="Search US City..." />
                    <CommandEmpty>No city found.</CommandEmpty>
                    <CommandGroup className="max-h-60 overflow-y-auto">
                      {US_CITIES.map((c) => (
                        <CommandItem key={c} value={c} onSelect={(val) => { setCity(val); setOpen(false); }} className="text-white">
                          <Check className={cn("mr-2 h-4 w-4", city === c ? "opacity-100" : "opacity-0")} />
                          {c}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Story</label>
            <Textarea value={text} onChange={(e) => setText(e.target.value)} className="bg-gray-800 border-gray-700 text-white" rows={5} />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full bg-red-600 hover:bg-red-700 py-6 rounded-2xl">
            {isSubmitting ? <Loader2 className="animate-spin" /> : "Post to Community"}
          </Button>
        </form>
      </Card>
    </div>
  );
}