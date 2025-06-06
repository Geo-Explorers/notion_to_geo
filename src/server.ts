/// <reference types="vite/client" />
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { import_notion_articles } from "../notion_api";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = import.meta.env.PORT || 3000;

app.use(express.json());

const publicPath = path.join(dirname(__dirname), "public");

app.get("/", (_req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

app.get("/process_news_stories", (_req, res) => {
  res.sendFile(path.join(publicPath, "process_news_stories.html"));
});

let isProcessingNewsStories = false;
app.post("/process", async (req, res) => {
  try {
    if (isProcessingNewsStories) {
      res.status(429).json({
        success: false,
        message: "News stories are already being processed",
      });

      return;
    }

    const { privateKey, walletAddress } = req.body;

    if (!privateKey) {
      res.status(400).json({
        success: false,
        message: "Private key is required",
      });
      return;
    }

    const pk_to_use = privateKey.startsWith("0x")
      ? privateKey
      : `0x${privateKey}`;

    isProcessingNewsStories = true;

    // const result = await import_notion_articles(pk_to_use);
    const result = await import_notion_articles(pk_to_use, walletAddress);

    res.json({
      success: true,
      message: "News stories processed successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error processing articles:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process news stories",
      trace: error,
    });
  } finally {
    isProcessingNewsStories = false;
  }
});

app
  .listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  })
  .on("error", (error) => {
    console.error("Error starting server:", error);
  });
