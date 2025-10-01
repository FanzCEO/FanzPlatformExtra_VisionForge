import { type ReactNode, useRef, useEffect } from "react";
import Uppy from "@uppy/core";
import { Dashboard } from "@uppy/react";
import XHRUpload from "@uppy/xhr-upload";
import type { UploadResult } from "@uppy/core";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{ method: string; url: string }>;
  onComplete?: (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => void;
  children?: ReactNode;
  buttonClassName?: string;
}

export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 100 * 1024 * 1024, // 100MB default
  onGetUploadParameters,
  onComplete,
  children,
  buttonClassName,
}: ObjectUploaderProps) {
  const uppyRef = useRef<Uppy | null>(null);

  if (!uppyRef.current) {
    uppyRef.current = new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
      },
    }).use(XHRUpload, {
      endpoint: "placeholder",
      async getUploadParameters(file) {
        const params = await onGetUploadParameters();
        return {
          method: params.method,
          url: params.url,
          headers: {},
        };
      },
    });
  }

  const uppy = uppyRef.current;

  useEffect(() => {
    if (onComplete) {
      uppy.on("complete", onComplete);
      return () => {
        uppy.off("complete", onComplete);
      };
    }
  }, [uppy, onComplete]);

  useEffect(() => {
    return () => {
      uppy.close();
    };
  }, [uppy]);

  if (children) {
    return (
      <div className={buttonClassName}>
        <Dashboard
          uppy={uppy}
          trigger={children as any}
          proudlyDisplayPoweredByUppy={false}
          hideUploadButton={false}
          note={`Max file size: ${Math.round(maxFileSize / (1024 * 1024))}MB`}
        />
      </div>
    );
  }

  return (
    <Dashboard
      uppy={uppy}
      proudlyDisplayPoweredByUppy={false}
      note={`Max file size: ${Math.round(maxFileSize / (1024 * 1024))}MB`}
    />
  );
}
