import type { Upload } from "@/app/admin/types";

interface UploadsTabProps {
  uploads: Upload[];
}

export default function UploadsTab({ uploads }: UploadsTabProps) {
  return (
    <>
      {uploads.length === 0 && (
        <p className="text-center">No uploads yet.</p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {uploads.map((upload) => (
          <figure
            key={upload.Key}
            className="overflow-hidden rounded-xl bg-gray-800 p-3 shadow"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={upload.presignedUrl}
              alt="Uploaded image"
              className="aspect-square w-full rounded-lg object-cover"
            />
            <figcaption className="mt-2 break-all text-base">
              <p>{upload.Key}</p>
              <time dateTime={upload.LastModified}>
                {upload.LastModified
                  ? new Date(upload.LastModified).toLocaleString()
                  : "Unknown upload time"}
              </time>
            </figcaption>
          </figure>
        ))}
      </div>
    </>
  );
}
