/// <reference types="vite/client" />
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { import_notion_articles } from "../notion_api";
import { SET_PK_SW } from "./config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = import.meta.env.VITE_PORT || 3000;

app.use(express.json());

const publicPath = path.join(dirname(__dirname), "public");

app.get("/", (_req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

app.post("/process", async (req, res) => {
  try {
    const { privateKey } = req.body;

    const pk_to_use = privateKey.startsWith("0x")
      ? privateKey
      : `0x${privateKey}`;

    console.log("server.ts: privateKey", pk_to_use);
    SET_PK_SW(pk_to_use);

    const result = await import_notion_articles();

    res.json({
      success: true,
      message: "News stories processed successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error processing articles:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to process news stories" });
  }
});

app
  .listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  })
  .on("error", (error) => {
    console.error("Error starting server:", error);
  });
