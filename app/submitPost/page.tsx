"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Upload, Loader2, X, Image as ImageIcon } from "lucide-react";

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
  
  // This is the secret to making my UI work
  const fileInputRef = useRef<HTMLInputElement>(null);

  // When they click my styled box, we "click" the hidden input for them
  const handleBoxClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
    }
  };

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
      console.error("Failed to submit post:", error);
      alert("Something went wrong. Please try again.");
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
              className="bg-gray-800 border-gray-700 text-white h-12 rounded-xl focus:ring-red-600"
            />
          </div>
          {/* Image Upload Area */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Photo of the Person</label>
            
            {/* The Hidden Input that actually does the work */}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              ref={fileInputRef}
              className="hidden"
            />

            {/* Your EXACT UI logic, now with a click handler */}
            <div 
              onClick={handleBoxClick}
              className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all min-h-[200px] cursor-pointer ${
                selectedImage ? "border-green-500/50 bg-green-500/5" : "border-gray-800 hover:border-gray-700 bg-gray-800/30"
              }`}
            >
              {!selectedImage ? (
                <div className="flex flex-col items-center pointer-events-none">
                  <Upload className="text-gray-500 mb-2" size={32} />
                  <p className="text-gray-500 text-sm text-center font-medium">Click to upload or drag and drop</p>
                  <p className="text-gray-600 text-xs mt-1">Images only (JPG, PNG)</p>
                </div>
              ) : (
                <div className="flex flex-col items-center w-full">
                   <div className="flex items-center gap-3 bg-gray-800 p-3 rounded-xl border border-gray-700 w-full mb-2">
                      <ImageIcon className="text-green-500" size={20} />
                      <span className="text-gray-200 text-sm truncate flex-1">{selectedImage.name}</span>
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-gray-400 hover:text-red-500 z-20"
                        onClick={(e) => {
                          e.stopPropagation(); // Stops it from opening the file picker again
                          setSelectedImage(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                      >
                        <X size={18} />
                      </Button>
                   </div>
                   <p className="text-xs text-gray-500">Click anywhere in the box to change photo</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Age</label>
              <Input
                type="number"
                placeholder="25"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white h-12 focus:ring-red-600"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">City</label>
              <Input
                placeholder="London"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white h-12 focus:ring-red-600"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Context / Story</label>
            <Textarea
              placeholder="What's the tea? Give us the details..."
              rows={5}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white resize-none focus:ring-red-600"
            />
          </div>

          <Button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-6 rounded-2xl transition-all active:scale-[0.98]"
          >
            {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}
            {isSubmitting ? "Brewing the tea..." : "Post to Community"}
          </Button>
        </form>
      </Card>
    </div>
  );
}