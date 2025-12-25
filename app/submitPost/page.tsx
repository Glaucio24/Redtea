"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { api } from "@/convex/_generated/api"
import { useMutation } from "convex/react"
import { toast } from "sonner" // 🎯 UPDATED: Import toast directly from sonner

// Assuming these components exist in your project
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Upload, Loader2, Send } from "lucide-react"

// Define the type for the post form data
type PostFormData = {
  text: string;
  age: string;
  city: string;
  file: File | null;
}

export default function SubmitPostPage() {
  const { user, isLoaded } = useUser();
  
  // --- STATE ---
  const [formData, setFormData] = useState<PostFormData>({
    text: "",
    age: "",
    city: "",
    file: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- CONVEX MUTATIONS ---
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const createPost = useMutation(api.posts.createPost); 

  // --- HANDLERS ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSubmitting) return;

    const { text, age, city, file } = formData;
    const numericAge = parseInt(age);

    if (!text.trim() && !file) {
      // 🎯 UPDATED: Using sonner toast
      toast.warning("Submission Blocked", {
        description: "Please enter some text or select a file to post.",
      });
      return;
    }
    if (isNaN(numericAge) || numericAge <= 0 || !city.trim()) {
      // 🎯 UPDATED: Using sonner toast
         toast.error("Missing Information", {
            description: "Please provide a valid age and city.",
         });
         return;
    }

    setIsSubmitting(true);

    try {
      let storageId: string | undefined = undefined;

      // 1. Handle File Upload (if a file is present)
      if (file) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!result.ok) {
          throw new Error(`File upload failed: ${result.statusText}`);
        }
        
        const { storageId: newStorageId } = await result.json();
        storageId = newStorageId;
      }

      // 2. Call the Convex mutation to create the post
      await createPost({
        text: text.trim(),
        age: numericAge,
        city: city.trim(),
        fileId: storageId,
      });

      // 3. Success Feedback and Reset
      // 🎯 UPDATED: Using sonner toast
      toast.success("Post Submitted! 🎉", {
        description: "Your content is now live.",
      });

      setFormData({ text: "", age: "", city: "", file: null });

    } catch (error) {
      console.error("Post submission failed:", error);
      // 🎯 UPDATED: Using sonner toast
      toast.error("Error Submitting Post", {
        description: "There was a problem saving your post. Check the console for details.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- UI Check ---
  if (!isLoaded) return <div>Loading...</div>;
  if (!user) return <div className="text-center p-8 text-gray-400">Please sign in to create a post.</div>;


  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Create New Post</h1>
        
        <Card className="bg-gray-800 border-gray-700 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-xl text-green-500">
              Share Your Story
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Context/Text Area */}
              <div className="space-y-2">
                <Label htmlFor="post-text" className="text-sm font-medium text-gray-300">
                  What happened? (Required if no file is uploaded)
                </Label>
                <Textarea
                  id="post-text"
                  name="text"
                  placeholder="Describe your situation or context here..."
                  value={formData.text}
                  onChange={handleInputChange}
                  rows={5}
                  className="bg-gray-700 border-gray-600 text-white focus:ring-green-500"
                />
              </div>

              {/* Age and City Inputs */}
              <div className="flex gap-4">
                  <div className="space-y-2 flex-1">
                    <Label htmlFor="post-age" className="text-sm font-medium text-gray-300">
                      Your Age
                    </Label>
                    <Input
                      id="post-age"
                      name="age"
                      type="number"
                      placeholder="e.g., 25"
                      value={formData.age}
                      onChange={handleInputChange}
                      className="bg-gray-700 border-gray-600 text-white"
                      min="18"
                      max="100"
                    />
                  </div>
                  <div className="space-y-2 flex-1">
                    <Label htmlFor="post-city" className="text-sm font-medium text-gray-300">
                      City/Location
                    </Label>
                    <Input
                      id="post-city"
                      name="city"
                      type="text"
                      placeholder="e.g., Houston, TX"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="post-file" className="text-sm font-medium text-gray-300 flex items-center">
                  <Upload className="w-4 h-4 mr-2" /> Upload Media (Optional: Image or Video)
                </Label>
                <Input
                  id="post-file"
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="bg-gray-700 border-gray-600 text-white file:text-green-400 file:bg-gray-600 file:border-none hover:file:bg-gray-500"
                />
                {formData.file && (
                    <p className="text-sm text-gray-400 mt-1">Selected file: **{formData.file.name}** ({Math.round(formData.file.size / 1024 / 1024)} MB)</p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Publish Post
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        
      </div>
    </div>
  )
}