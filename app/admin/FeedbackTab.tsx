"use client";

import { useQuery } from "@tanstack/react-query";
import { apiJson, queryKeys } from "@/app/api";

interface FeedbackEntry {
  id: string;
  message: string;
  createdAt: string;
}

export default function FeedbackTab() {
  const feedback = useQuery({
    queryKey: queryKeys.admin.feedback,
    queryFn: ({ signal }) =>
      apiJson<{ feedback: FeedbackEntry[] }>("/api/admin/feedback", { signal }),
  });

  if (feedback.isPending) {
    return <p className="text-center">Loading…</p>;
  }
  if (feedback.isError) {
    return <p className="text-center text-red-300">Could not load feedback.</p>;
  }

  const entries = feedback.data.feedback;
  return (
    <section className="mx-auto max-w-3xl space-y-3 rounded-xl bg-gray-800 p-5 shadow">
      <h2 className="text-2xl">Feedback ({entries.length})</h2>
      {entries.length === 0 ? (
        <p>No feedback yet.</p>
      ) : (
        <ul className="space-y-3">
          {entries.map((entry) => (
            <li key={entry.id} className="rounded-lg bg-gray-700 p-4">
              <p className="whitespace-pre-wrap">{entry.message}</p>
              <p className="mt-2 text-sm text-gray-400">
                {new Date(entry.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
