
import { execSync } from "child_process";
import  readline  from "readline";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})
//I didnt get this part of the code.
const question = (query) => { 
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer);
    });
  });
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

(async () => {
  try {
    execSync("git add .");
    const diff = execSync("git diff --cached").toString();

    if (!diff.trim()) {
      console.log("No staged changes to commit.");
      return;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

    const result = await model.generateContent([
      "The commit message should be short and to the point, like a git commit message. So that we I see the commit message I would say ohhh... this is what I did.",
      diff.slice(0, 10000),
    ]);
    if (result.error) {
      throw new Error(result.error);
    }
    
    const message = result.response.text().trim();

    execSync(`git commit -m "${message}"`);

    execSync("git push");

    console.log("✅ Committed and pushed:", message);
  } catch (err) {
    console.log(err.stderr.toString());
  }
})();


