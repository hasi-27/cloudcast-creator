import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const requestSchema = z.object({ text: z.string().min(1) });

const responseSchema = z.object({
  audioFile: z.string().url(),
});

export const generatePodcast = createServerFn({ method: "POST" })
  .validator((data) => requestSchema.parse(data))
  .handler(async ({ data }) => {
    const webhookUrl = "https://workflow.ccbp.in/webhook/5d70fd07-8b96-4251-99f1-1b3a58e08f25";

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: data.text }),
    });

    if (!response.ok) {
      throw new Error(`Webhook failed with status ${response.status}`);
    }

    const payload = await response.json();
    const parsed = responseSchema.safeParse(payload);

    if (!parsed.success) {
      throw new Error("Invalid response from podcast service");
    }

    return parsed.data;
  });
