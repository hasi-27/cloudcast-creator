import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const WEBHOOK_URL =
  "https://workflow.ccbp.in/webhook-test/5d70fd07-8b96-4251-99f1-1b3a58e08f25";

const requestSchema = z.object({
  text: z.string().min(1),
});

const responseSchema = z.object({
  audioFile: z.string().min(1),
});

export const generatePodcast = createServerFn({ method: "POST" })
  .inputValidator((input) => requestSchema.parse(input))
  .handler(async ({ data }) => {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ text: data.text }),
    });

    if (!response.ok) {
      throw new Error(`Webhook failed with status ${response.status}`);
    }

    const rawBody = await response.json();
    const parsed = responseSchema.parse(rawBody);
    return parsed;
  });
