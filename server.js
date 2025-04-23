
import { execSync } from "child_process";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

(async () => {
  try {
    execSync("git add .");
    const diff = execSync("git diff --cached").toString();

    if (!diff.trim()) {
      console.log("No staged changes to commit.");
      return;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent([
      "Write a concise git commit message for the following code diff:",
      diff.slice(0, 10000),
    ]);
    if (result.error) {
      throw new Error(result.error);
    }
    console.log("Generated commit message:", result.response.text());
    const message = result.response.text().trim();

    console.log(execSync(`git commit -m "${message}"`).toString());
    // execSync("git push");

    console.log("✅ Committed and pushed:", message);
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
})();


