import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const WEBHOOK_URL =
  "https://workflow.ccbp.in/webhook-test/5d70fd07-8b96-4251-99f1-1b3a58e08f25";

const requestSchema = z.object({
  text: z.string().min(1),
});

function findAudioUrl(value: unknown, depth = 0): string | undefined {
  if (depth > 5 || value == null) return undefined;
  if (typeof value === "string") {
    return /^https?:\/\//.test(value) ? value : undefined;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findAudioUrl(item, depth + 1);
      if (found) return found;
    }
    return undefined;
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    for (const key of ["audioFile", "audio_url", "audioUrl", "url", "link"]) {
      const candidate = obj[key];
      if (typeof candidate === "string" && candidate.length > 0) return candidate;
    }
    for (const item of Object.values(obj)) {
      const found = findAudioUrl(item, depth + 1);
      if (found) return found;
    }
  }
  return undefined;
}

function findBase64Audio(value: unknown, depth = 0): string | undefined {
  if (depth > 5 || value == null) return undefined;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findBase64Audio(item, depth + 1);
      if (found) return found;
    }
    return undefined;
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    for (const key of ["data", "base64", "audio", "audioBase64", "audioFile"]) {
      const candidate = obj[key];
      if (typeof candidate === "string" && candidate.length > 500 && !/\s/.test(candidate)) {
        return candidate.replace(/^data:[^,]+,/, "");
      }
    }
    for (const item of Object.values(obj)) {
      const found = findBase64Audio(item, depth + 1);
      if (found) return found;
    }
  }
  return undefined;
}

export const generatePodcast = createServerFn({ method: "POST" })
  .validator((input) => requestSchema.parse(input))
  .handler(async ({ data }) => {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: data.text }),
    });

    const contentType = response.headers.get("content-type") ?? "";

    // n8n can respond with the audio binary itself instead of a JSON link.
    if (response.ok && /^(audio|application\/octet-stream)/i.test(contentType)) {
      const buffer = await response.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
      const mime = contentType.startsWith("audio") ? contentType.split(";")[0] : "audio/mpeg";
      return { audioFile: `data:${mime};base64,${base64}` };
    }

    const rawText = await response.text();

    if (!response.ok) {
      let hint = "";
      try {
        const parsedError = JSON.parse(rawText) as { message?: string; hint?: string };
        hint = [parsedError.message, parsedError.hint].filter(Boolean).join(" ");
      } catch {
        hint = rawText.slice(0, 200);
      }
      throw new Error(
        hint || `The podcast service responded with status ${response.status}.`,
      );
    }

    let parsedBody: unknown;
    try {
      parsedBody = JSON.parse(rawText);
    } catch {
      throw new Error(`Unexpected response from the podcast service: ${rawText.slice(0, 200)}`);
    }

    const audioFile = findAudioUrl(parsedBody);
    if (!audioFile) {
      const base64Audio = findBase64Audio(parsedBody);
      if (base64Audio) return { audioFile: `data:audio/mpeg;base64,${base64Audio}` };
      throw new Error(
        `The podcast service replied without an audio link: ${rawText.slice(0, 200)}`,
      );
    }

    return { audioFile };

  });

