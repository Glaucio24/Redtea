// app/onboarding/page.tsx (FIXED)
'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
// Import UI components...
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();

  // 🛑 FIX: Use the 'finishOnboarding' mutation, NOT 'createUser'
  const finishOnboarding = useMutation(api.users.finishOnboarding);
  
  const [name, setName] = useState(`${user?.firstName || ''} ${user?.lastName || ''}`.trim()); // Initialize name from Clerk
  const [pseudonym, setPseudonym] = useState(''); // User must provide this
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim() || !pseudonym.trim() || !selfieFile || !idFile) {
        setError("Please fill all required fields and upload both photos.");
        return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // NOTE: In a production environment, these should be uploaded to Convex storage
      // or a service like UploadThing to get a persistent URL before calling the mutation.
      // For testing, we'll assume a persistent URL is returned/created.
      const selfieUrl = 'https://mock.url/selfie-' + user.id; // Mock persistent URL
      const idUrl = 'https://mock.url/id-' + user.id; // Mock persistent URL

      // 🛑 FIX: Call the UPDATE mutation
      await finishOnboarding({
        clerkId: user.id,
        name: name,
        pseudonym: pseudonym,
        selfieUrl: selfieUrl,
        idUrl: idUrl,
      });

      // Redirect user to the waiting-approval page
      router.push('/waiting-approval'); 
      
    } catch (err) {
      console.error('Onboarding failed:', err);
      // Check for user not found error (if webhook hasn't run)
      setError('Profile update failed. If this is your first time, please refresh.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-center">
            Complete Your Onboarding
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input for Real Name */}
            <div>
              <Label htmlFor="name">Real Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Input for Pseudonym */}
            <div>
              <Label htmlFor="pseudonym">Pseudonym (App Identity)</Label>
              <Input
                id="pseudonym"
                type="text"
                value={pseudonym}
                onChange={(e) => setPseudonym(e.target.value)}
                required
              />
            </div>
            
            {/* Selfie Upload */}
            <div>
              <Label htmlFor="selfie">Upload a Selfie</Label>
              <Input
                id="selfie"
                type="file"
                accept="image/*"
                onChange={(e) => setSelfieFile(e.target.files?.[0] || null)}
                required
              />
            </div>

            {/* ID Upload */}
            <div>
              <Label htmlFor="id">Upload an ID Photo</Label>
              <Input
                id="id"
                type="file"
                accept="image/*"
                onChange={(e) => setIdFile(e.target.files?.[0] || null)}
                required
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !name.trim() || !pseudonym.trim() || !selfieFile || !idFile}
            >
              {isSubmitting ? 'Submitting...' : 'Finish Onboarding & Request Approval'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="text-center text-sm text-muted-foreground">
          Once submitted, you’ll be notified after admin approval.
        </CardFooter>
      </Card>
    </div>
  );
}