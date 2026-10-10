"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type ChangeEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiJson, queryKeys } from "@/app/api";
import LiveCamera from "@/app/new/upload-photo/LiveCamera";
import PhotoCropModal from "@/app/new/upload-photo/PhotoCropModal";
import { Button, LabelButton } from "@/app/Button";
import SignupGate from "@/app/SignupGate";
import InlineLink from "@/app/InlineLink";

interface PreparedUpload {
  url: string;
  fields: Record<string, string>;
}

export default function PhotoUploadPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [cameraOn, setCameraOn] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cropSourceUrl, setCropSourceUrl] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [showUploadPrompt, setShowUploadPrompt] = useState(false);

  const uploadPhoto = useMutation({
    mutationFn: async (photo: File) => {
      const upload = await apiJson<PreparedUpload>(
        "/api/prepare-image-upload",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: photo.name }),
        },
        "Could not prepare upload",
      );
      const imageKey = upload.fields.key;
      if (!imageKey) throw new Error("Upload key missing");

      const formData = new FormData();
      Object.entries(upload.fields).forEach(([key, value]) => {
        formData.append(key, value);
      });
      formData.append("Content-Type", photo.type);
      formData.append("file", photo);

      const uploadResponse = await fetch(upload.url, {
        method: "POST",
        body: formData,
      });
      if (!uploadResponse.ok) throw new Error("Upload failed");
      return imageKey;
    },
    onSuccess: (imageKey) => {
      sessionStorage.setItem("uploadedImageKey", imageKey);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.admin.uploads,
      });
      router.push("/new/choose-name");
    },
  });

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => () => {
    if (cropSourceUrl) URL.revokeObjectURL(cropSourceUrl);
  }, [cropSourceUrl]);

  const showPreview = useCallback((nextFile: File) => {
    setFile(nextFile);
    setPreviewUrl(URL.createObjectURL(nextFile));
    setCropSourceUrl(null);
    setStatus("");
    setCameraOn(false);
  }, []);

  const handleCameraError = useCallback(() => {
    setCameraOn(false);
    setStatus("Could not access the camera. You can upload a photo instead.");
  }, []);

  const selectFile = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = "";
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith("image/")) {
      setStatus("Please choose an image.");
      return;
    }
    uploadPhoto.reset();
    setCameraOn(false);
    setStatus("");
    setCropSourceUrl(URL.createObjectURL(selectedFile));
  };

  const startUpload = () => {
    setShowUploadPrompt(false);
    if (!file) return;
    if (file.size > 2_000_000) {
      setStatus("Please choose an image smaller than 2 MB.");
      return;
    }

    setStatus("");
    uploadPhoto.mutate(file);
  };

  const startPhotoAgain = () => {
    setCameraOn(true);
    setFile(null);
    setPreviewUrl(null);
    setStatus("");
    uploadPhoto.reset();
  }

  const photoPicker = (
    <LabelButton theme="secondary">
      select a file
      <input className="hidden" type="file" accept="image/*" onChange={selectFile} disabled={uploadPhoto.isPending} />
    </LabelButton>
  );

  return (
    <SignupGate>
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-4">
      <InlineLink href="/start" size="2xl">
        ← back
      </InlineLink>
      <img src="/duck_photo.png" alt="A duck taking a photo" className="w-32" />
      <h1 className="text-3xl text-center">Upload time!</h1>
      {!previewUrl && (
        <>
          <p>Upload your self-portrait image here.</p>

          {cameraOn ? (
            <LiveCamera circular zoomable onCapture={showPreview} onError={handleCameraError} />
          ) : (
            <Button
              onClick={() => {
                setCameraOn(true);
                setStatus("");
              }}
            >
              use camera
            </Button>
          )}

          {photoPicker}
        </>)}
      {previewUrl && (
        <>
          {/* A blob URL is required here, which is not supported by next/image. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Selected self-portrait" className="aspect-square w-80 max-w-full rounded-full object-cover" />
          <p>Looks good!</p>
          <Button
            onClick={() => setShowUploadPrompt(true)}
            disabled={uploadPhoto.isPending}
          >
            {uploadPhoto.isPending ? "uploading..." : "happy with that!"}
          </Button>
          <Button onClick={startPhotoAgain} theme="secondary" disabled={uploadPhoto.isPending}>
            actually, take a new photo
          </Button>
          {photoPicker}
        </>
      )}
      {cropSourceUrl && (
        <PhotoCropModal
          imageUrl={cropSourceUrl}
          onComplete={showPreview}
          onClose={() => setCropSourceUrl(null)}
        />
      )}

      {(status || uploadPhoto.isError) && (
        <p role="status">
          {status || "The photo could not be uploaded. Please try again."}
        </p>
      )}
      {showUploadPrompt && previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-scroll max-h-full">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <img src={previewUrl} alt="Selected self-portrait" className="aspect-square w-80 max-w-full rounded-full object-cover" />
            <h3 className="text-2xl my-4 text-center">Just to check</h3>
            <p className="mb-4">Everyone is going to need to recognise you with this photo, are you happy that it looks enough like you?</p>
            <div className="flex flex-col gap-2">
              <Button theme="secondary" onClick={() => setShowUploadPrompt(false)}>
                no ok take another
              </Button>
              <Button onClick={startUpload} disabled={uploadPhoto.isPending}>
                i'm literally so happy with this
              </Button>
              <Button onClick={startUpload} disabled={uploadPhoto.isPending}>
                it looks nothing like me but neither will anything else yolo
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
    </SignupGate>
  );
}