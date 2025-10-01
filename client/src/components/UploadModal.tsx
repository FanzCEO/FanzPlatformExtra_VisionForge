import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ObjectUploader } from "./ObjectUploader";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { UploadResult } from "@uppy/core";

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
}

export default function UploadModal({ open, onClose }: UploadModalProps) {
  const [caption, setCaption] = useState("");
  const [contentType, setContentType] = useState<"image" | "video" | "gallery">("image");
  const [visibility, setVisibility] = useState<"free" | "premium" | "exclusive">("free");
  const [watermark, setWatermark] = useState(true);
  const [uploadedUrl, setUploadedUrl] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleGetUploadParameters = async () => {
    const res = await apiRequest("POST", "/api/objects/upload");
    const data = await res.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const url = result.successful[0].uploadURL;
      setUploadedUrl(url!);
      
      // Finalize upload with ACL
      try {
        const res = await apiRequest("PUT", "/api/objects/finalize", {
          objectURL: url,
          visibility: visibility === "free" ? "public" : "private",
        });
        const data = await res.json();
        setUploadedUrl(data.objectPath);
      } catch (error) {
        console.error("Error finalizing upload:", error);
      }
    }
  };

  const createPostMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/posts", {
        contentType,
        visibility,
        caption,
        mediaUrls: [uploadedUrl],
        thumbnailUrl: uploadedUrl,
        hasWatermark: watermark,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Post created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      onClose();
      // Reset form
      setCaption("");
      setUploadedUrl("");
      setContentType("image");
      setVisibility("free");
      setWatermark(true);
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      });
    },
  });

  const handlePublish = () => {
    if (!uploadedUrl) {
      toast({
        title: "Error",
        description: "Please upload content first",
        variant: "destructive",
      });
      return;
    }
    createPostMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Upload Area */}
          {!uploadedUrl ? (
            <ObjectUploader
              maxNumberOfFiles={1}
              maxFileSize={500 * 1024 * 1024} // 500MB
              onGetUploadParameters={handleGetUploadParameters}
              onComplete={handleComplete}
              buttonClassName="w-full"
            >
              <div className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary transition-colors">
                <svg className="w-16 h-16 mx-auto mb-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-lg font-semibold mb-2">Drop files here or click to browse</p>
                <p className="text-sm text-muted-foreground">Supports images and videos up to 500MB</p>
              </div>
            </ObjectUploader>
          ) : (
            <div className="bg-card rounded-lg p-4 border border-border">
              <p className="text-sm text-muted-foreground">File uploaded successfully</p>
              <p className="text-xs font-mono truncate mt-1">{uploadedUrl}</p>
            </div>
          )}

          {/* Caption */}
          <div className="space-y-2">
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              placeholder="Write a caption..."
              rows={4}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              data-testid="input-caption"
            />
          </div>

          {/* Content Type */}
          <div className="space-y-2">
            <Label htmlFor="content-type">Content Type</Label>
            <Select value={contentType} onValueChange={(value: any) => setContentType(value)}>
              <SelectTrigger data-testid="select-content-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="gallery">Gallery</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <Label htmlFor="visibility">Visibility</Label>
            <div className="grid grid-cols-3 gap-3">
              <Button
                type="button"
                variant={visibility === "free" ? "default" : "outline"}
                onClick={() => setVisibility("free")}
                className="w-full"
                data-testid="button-visibility-free"
              >
                Free
              </Button>
              <Button
                type="button"
                variant={visibility === "premium" ? "default" : "outline"}
                onClick={() => setVisibility("premium")}
                className="w-full"
                data-testid="button-visibility-premium"
              >
                Premium
              </Button>
              <Button
                type="button"
                variant={visibility === "exclusive" ? "default" : "outline"}
                onClick={() => setVisibility("exclusive")}
                className="w-full"
                data-testid="button-visibility-exclusive"
              >
                Exclusive
              </Button>
            </div>
          </div>

          {/* Watermark */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="watermark"
              checked={watermark}
              onCheckedChange={(checked) => setWatermark(checked as boolean)}
              data-testid="checkbox-watermark"
            />
            <Label htmlFor="watermark" className="text-sm font-medium cursor-pointer">
              Add watermark protection
            </Label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={onClose} className="flex-1" data-testid="button-cancel">
              Cancel
            </Button>
            <Button
              onClick={handlePublish}
              disabled={createPostMutation.isPending || !uploadedUrl}
              className="flex-1 bg-gradient-to-r from-primary to-secondary"
              data-testid="button-publish"
            >
              {createPostMutation.isPending ? "Publishing..." : "Publish Post"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
