'use client';

import { useState, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRouter } from 'next/navigation';
import { useConvexUpload } from '@/hooks/useConvexUpload'; 
import { toast } from "sonner";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, ShieldCheck, UserCircle, IdCard } from "lucide-react";

export default function OnboardingPage() {
    const { user, isLoaded } = useUser();
    const router = useRouter();

    const { uploadFile } = useConvexUpload();
    const finishOnboarding = useMutation(api.users.finishOnboarding); 
    
    const [selfieFile, setSelfieFile] = useState<File | null>(null);
    const [idFile, setIdFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isFormValid = useMemo(() => {
        return selfieFile !== null && idFile !== null;
    }, [selfieFile, idFile]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!isFormValid || !user || !isLoaded) {
            toast.error("Missing Documents", {
                description: "Please upload both your selfie and ID document.",
            });
            return;
        }

        try {
            setIsSubmitting(true);
            const clerkId = user.id;

            // 1. Upload Selfie
            await uploadFile(selfieFile!, clerkId, 'selfie');
            
            // 2. Upload ID Document
            await uploadFile(idFile!, clerkId, 'id');

            // 3. Finalize Onboarding
            await finishOnboarding({
                clerkId: clerkId,
            });

            toast.success("Documents Uploaded", {
                description: "Your verification is now pending review.",
            });

            router.push('/waiting-approval'); 
            
        } catch (err) {
            console.error('Upload failed:', err);
            toast.error("Submission Failed", {
                description: "There was an error uploading your documents. Please try again.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isLoaded) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <div className="container mx-auto p-6">
                <h1 className="text-3xl font-bold mb-6">Identity Verification</h1>
                
                <Card className="bg-gray-800 border-gray-700 max-w-2xl mx-auto">
                    <CardHeader>
                        <CardTitle className="text-xl text-green-500 flex items-center gap-2">
                            <ShieldCheck className="w-6 h-6" />
                            Secure Your Account
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-8">
                            
                            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 text-sm text-gray-400">
                                <p>To maintain community safety, RedTea requires a one-time identity verification. Your documents are stored securely and used only for approval.</p>
                            </div>

                            {/* Selfie Upload */}
                            <div className="space-y-4">
                                <Label htmlFor="selfie" className="text-sm font-medium text-gray-300 flex items-center">
                                    <UserCircle className="w-4 h-4 mr-2" /> 1. Upload a clear Selfie Photo
                                </Label>
                                <Input
                                    id="selfie"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setSelfieFile(e.target.files?.[0] || null)}
                                    className="bg-gray-700 border-gray-600 text-white file:text-green-400 file:bg-gray-600 file:border-none hover:file:bg-gray-500"
                                    required
                                />
                                {selfieFile && (
                                    <p className="text-xs text-green-500 font-medium font-mono italic">
                                        Selected: {selfieFile.name}
                                    </p>
                                )}
                            </div>

                            {/* ID Upload */}
                            <div className="space-y-4">
                                <Label htmlFor="id" className="text-sm font-medium text-gray-300 flex items-center">
                                    <IdCard className="w-4 h-4 mr-2" /> 2. Upload Photo of ID Document
                                </Label>
                                <Input
                                    id="id"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setIdFile(e.target.files?.[0] || null)}
                                    className="bg-gray-700 border-gray-600 text-white file:text-green-400 file:bg-gray-600 file:border-none hover:file:bg-gray-500"
                                    required
                                />
                                {idFile && (
                                    <p className="text-xs text-green-500 font-medium font-mono italic">
                                        Selected: {idFile.name}
                                    </p>
                                )}
                            </div>

                            {/* Submit Button - Changed to Green */}
                            <Button
                                type="submit"
                                className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg font-semibold transition-all"
                                disabled={isSubmitting || !isFormValid}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Processing Documents...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-5 h-5 mr-2" />
                                        Submit for Verification
                                    </>
                                )}
                            </Button>

                            <p className="text-center text-xs text-gray-500 mt-4">
                                Verification typically takes 24-48 hours. You will receive access once approved.
                            </p>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}