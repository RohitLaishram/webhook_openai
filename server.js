import OpenAI from "openai";
import express from "express";
import dotenv from "dotenv";
dotenv.config();

const app = express();

console.log(process.env.OPENAI_WEBHOOK_SECRET);
// IMPORTANT: Use raw body for signature verification
app.use(express.text({ type: "application/json" }));

// Load the webhook secret from environment variable
const client = new OpenAI({
  apiKey: process.env.API_KEY,
  webhookSecret: process.env.OPENAI_WEBHOOK_SECRET,
});

app.get("/test", (req, res) => {
  res.send("Server is running test for");
});

// Webhook endpoint
app.post("/openai/webhook", async (req, res) => {
  try {
    // Verify webhook signature
    const event = await client.webhooks.unwrap(req.body, req.headers);
    console.log(event);
    console.log("=====================================");
    console.log("🔔 Webhook Received:", event.type);

    // ---------- Fine-tuning events ----------
    if (event.type.startsWith("fine_tuning.job")) {
      const job = event.data;

      console.log("📌 Job ID:", job.id);
      console.log("📌 Status:", job.status);

      switch (event.type) {
        case "fine_tuning.job.created":
          console.log("📥 Fine-tuning job created.");
          break;

        case "fine_tuning.job.running":
          console.log("⚙️ Fine-tuning job is now running.");
          break;

        case "fine_tuning.job.succeeded":
          console.log("🎉 Fine-tuning COMPLETED!");
          console.log("Model:", job.fine_tuned_model);
          break;

        case "fine_tuning.job.failed":
          console.log("❌ Fine-tuning FAILED.");
          console.log("Error:", job.error);
          break;

        case "fine_tuning.job.canceled":
          console.log("⚠️ Fine-tuning was canceled.");
          break;
      }
    }

    res.sendStatus(200);
  } catch (error) {
    if (error instanceof OpenAI.InvalidWebhookSignatureError) {
      console.error("❌ Invalid webhook signature");
      res.status(400).send("Invalid signature");
    } else {
      console.error("❌ Error processing webhook:", error.message);
      res.sendStatus(500);
    }
  }
});

// Start the server
app.listen(8000, () => {
  console.log("🚀 Webhook server running on port 8000");
});
