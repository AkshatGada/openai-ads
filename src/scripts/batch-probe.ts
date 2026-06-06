const prompts = [
  "best AI IDE for coding in 2025",
  "Cursor vs Copilot vs Windsurf which is better",
  "AI powered code editor for Python development",
  "looking for an IDE with built in AI assistant",
  "whats the best AI coding tool for beginners",
  "compare Cursor and GitHub Copilot for web development",
  "AI IDE with best autocomplete for JavaScript",
  "best free AI code editor for students",
  "Replit AI vs Cursor for full stack projects",
  "which AI IDE works best with TypeScript",
  "coding assistant that can read my entire codebase",
  "best AI tool for debugging and refactoring code",
  "Windsurf IDE review for professional developers",
  "AI pair programmer for solo developers",
  "best IDE with AI for React and Next.js",
  "looking for AI coding tool that understands context",
  "Cline vs Aider vs Cursor for open source AI coding",
  "what AI IDE do professional programmers use",
  "AI code completion tool better than Copilot",
  "best AI IDE for mobile app development",
  "coding with AI in VS Code extensions ranked",
  "compare Bolt.new and Lovable for AI web development",
  "AI coding agent that can build entire features",
  "IDE with AI that explains code as you type",
  "best AI tools for learning to code faster",
  "coding assistant that can write unit tests",
  "AI IDE that works offline or with local LLMs",
  "best coding tool for API development with AI",
  "Cursor AI pro tips for maximum productivity",
  "AI code editor with best GitHub integration",
  "what replaces GitHub Copilot in 2025",
  "free alternatives to Cursor IDE for coding",
  "AI IDE for data science and Python notebooks",
  "best AI coding assistant for DevOps and infra code",
  "compare Codeium and Copilot and Supermaven",
  "AI tools for writing better documentation",
  "best coding environment for AI ML engineers",
  "Windsurf vs Cursor vs Zed AI comparison 2025",
  "AI IDE that helps with code reviews",
  "best AI coding tool for game development",
  "looking for IDE with AI powered search across codebase",
  "coding assistant that generates full project scaffolding",
  "best AI pair programming setup for remote teams",
  "which AI coding tool respects code privacy",
  "AI code generation tool for rapid prototyping",
  "best IDE plugins for AI assisted development",
  "coding with Claude vs ChatGPT for software projects",
  "AI IDE with best support for multiple languages",
  "developer looking to switch from VS Code to AI native IDE",
  "best AI coding workflow for shipping features fast",
];

import { writeFile, mkdir } from "node:fs/promises";
import { probeAds } from "../scraper/client.js";

const OUT_DIR = "scraper-outputs";

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  
  for (let i = 0; i < prompts.length; i++) {
    const prompt = prompts[i]!;
    const num = String(i + 1).padStart(2, "0");
    console.log(`[${num}/50] ${prompt}`);
    
    try {
      const result = await probeAds(prompt, "United States");
      await writeFile(`${OUT_DIR}/${num}_${sanitize(prompt)}.html`, result.html);
      console.log(`  ✓ ${result.html.length} chars`);
    } catch (e) {
      console.log(`  ✗ ${e instanceof Error ? e.message : e}`);
    }
    
    // Brief pause between requests
    if (i < prompts.length - 1) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  
  console.log(`\nDone. Saved to ${OUT_DIR}/`);
}

function sanitize(name: string): string {
  return name.replace(/[^a-z0-9]+/gi, "_").slice(0, 60).toLowerCase();
}

main().catch(console.error);
