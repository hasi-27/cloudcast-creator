import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { generatePodcast } from "../lib/podcast.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Podcast Studio - Generate your podcast" },
      {
        name: "description",
        content: "Turn any topic into a podcast with one click. Cute, simple, and fast.",
      },
      {
        property: "og:title",
        content: "Podcast Studio - Generate your podcast",
      },
      {
        property: "og:description",
        content: "Turn any topic into a podcast with one click. Cute, simple, and fast.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [topic, setTopic] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) return;

    setAudioUrl(null);
    setErrorDetail(null);
    setStatus("loading");

    try {
      const result = await generatePodcast({ data: { text: topic.trim() } });
      setAudioUrl(result.audioFile);
      setStatus("success");
      setTopic("");
    } catch (error) {
      setErrorDetail(error instanceof Error ? error.message : null);
      setStatus("error");
    }
  };


  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
      {/* Decorative pastel blobs */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 -right-48 h-80 w-80 rounded-full bg-soft/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-warm/20 blur-3xl" />

      <div className="relative w-full max-w-xl rounded-[2rem] border border-border bg-card p-6 shadow-2xl shadow-primary/5 sm:p-10">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-3xl">
            🎙️
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-card-foreground sm:text-3xl">
            Podcast Studio
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Type a topic and we’ll craft a podcast just for you.
          </p>
        </div>

        {/* Input + Button */}
        <div className="mt-8 space-y-4">
          <div className="relative">
            <label htmlFor="topic" className="sr-only">
              Podcast topic
            </label>
            <input
              id="topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              placeholder="Type podcast topic here..."
              className="w-full rounded-2xl border border-input bg-background px-5 py-4 text-base text-foreground placeholder:text-muted-foreground/70 shadow-sm outline-none ring-ring transition-all focus:ring-2 focus:ring-offset-2 focus:ring-offset-background"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={status === "loading" || !topic.trim()}
            className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-cute hover:shadow-xl hover:shadow-primary/30 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="text-xl transition-transform group-hover:scale-110">🔊</span>
            <span>Generate Podcast</span>
          </button>
        </div>

        {/* Audio player / status area */}
        <div className="mt-8 rounded-2xl border border-border bg-bubble p-6 sm:p-8">
          {status === "idle" && (
            <div className="flex flex-col items-center justify-center gap-3 text-bubble-foreground">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-xl">
                🎧
              </div>
              <p className="text-sm font-medium">Podcast will appear here</p>
            </div>
          )}

          {status === "loading" && (
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <span className="dot-pulse h-3 w-3 rounded-full bg-primary" style={{ animationDelay: "0ms" }} />
                <span className="dot-pulse h-3 w-3 rounded-full bg-primary" style={{ animationDelay: "160ms" }} />
                <span className="dot-pulse h-3 w-3 rounded-full bg-primary" style={{ animationDelay: "320ms" }} />
              </div>
              <p className="text-sm font-medium text-bubble-foreground">Creating podcast... please wait!</p>
            </div>
          )}

          {status === "success" && audioUrl && (
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-soft text-xl">🎵</div>
              <p className="text-lg font-semibold text-card-foreground">Podcast is ready! Click play to listen</p>
              <audio
                controls
                src={audioUrl}
                className="w-full rounded-xl"
                aria-label="Generated podcast audio"
              />
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center justify-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-xl">😿</div>
              <p className="text-lg font-semibold text-card-foreground">Oops! Something went wrong. Please try again</p>
            </div>
          )}
        </div>

        {/* Tiny footer */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Built for quick, cozy podcast ideas.
        </p>
      </div>
    </main>
  );
}
