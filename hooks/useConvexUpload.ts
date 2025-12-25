// useConvexUpload.ts

import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import type { Id } from "@/convex/_generated/dataModel" 

export function useConvexUpload() {
  
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  // Correctly referencing the server mutation
  const saveStorageId = useMutation(api.users.updateVerificationDocuments);

  /**
   * Performs the 3-step Convex file upload: Get URL -> POST file -> Save storage ID.
   * * @param file The File object to upload.
   * @param clerkId The Clerk ID (string) of the user, as required by the server mutation.
   * @param documentType 'selfie' or 'id' to specify which field to update.
   */
  const uploadFile = async (
    file: File,
    clerkId: string, // 🎯 CORRECTION 1: Must accept clerkId (string) not Id<"users">
    documentType: 'selfie' | 'id' 
  ) => {
    try {
      // Step 1: Generate the upload URL
      const postUrl = await generateUploadUrl();

      // Step 2: POST the file content to the upload URL (Unchanged)
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error("File upload failed to Convex storage.");
      }

      // Get the storage ID
      const { storageId } = (await result.json()) as { storageId: Id<"_storage"> };
      
      // Step 3: Save the storage ID in your database document
      // 🎯 CORRECTION 2: The payload must match the server mutation args (clerkId, selfieStorageId/idStorageId)
      await saveStorageId({
        clerkId: clerkId, // Pass the Clerk ID
        // Pass the storage ID in the correct optional field based on documentType
        selfieStorageId: documentType === 'selfie' ? storageId : undefined,
        idStorageId: documentType === 'id' ? storageId : undefined,
      });

      return storageId;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  };

  return { uploadFile };
}