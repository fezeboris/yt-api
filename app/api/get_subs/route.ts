// // app/api/get_subs/route.ts
// import { NextResponse } from "next/server";
// import { createRequire } from "module";
// import path from "path";
// import fs from "fs";
// import os from "os";
// const require = createRequire(import.meta.url);
// const youtubedl = require("youtube-dl-exec");

// // const DOWNLOAD_DIR = path.join(process.cwd(), "downloads");
// const DOWNLOAD_DIR = path.join(os.tmpdir(), "yt-subs-downloads");

// // --- Helper Function to Parse VTT ---
// type SubtitleCue = {
//   start: string;
//   text: string;
// };

// function parseVTT(vttContent: string): SubtitleCue[] {
//   const cues: SubtitleCue[] = [];
//   const blocks = vttContent.trim().split("\n\n");

//   for (let i = 1; i < blocks.length; i++) {
//     const block = blocks[i];
//     const lines = block.split("\n");

//     if (lines.length < 2) continue;

//     const timestampLine = lines[0];
//     if (timestampLine.includes("-->")) {
//       const startTime = timestampLine.split(" --> ")[0];
//       const text = lines
//         .slice(1)
//         .join(" ")
//         .replace(/<[^>]+>/g, "") // Remove VTT tags
//         .trim();

//       if (text) {
//         cues.push({ start: startTime, text });
//       }
//     }
//   }
//   return cues;
// }
// // ------------------------------------

// export async function POST(req: Request) {
//   try {
//     const { youtubeUrl } = await req.json();
//     if (!youtubeUrl) {
//       return NextResponse.json(
//         { error: "No YouTube URL provided" },
//         { status: 400 }
//       );
//     }

//     // Ensure the download directory exists
//     if (!fs.existsSync(DOWNLOAD_DIR)) {
//       fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
//     }

//     // Run yt-dlp to download the file
//     await youtubedl(youtubeUrl, {
//       writeAutoSub: true,
//       writeSub: true,
//       subLang: "en",
//       skipDownload: true,
//       output: path.join(DOWNLOAD_DIR, "temp_%(id)s"), // Use a predictable naming scheme
//     });

//     const files = fs
//       .readdirSync(DOWNLOAD_DIR)
//       .filter((f) => f.endsWith(".vtt"));

//     if (files.length === 0) {
//       return NextResponse.json(
//         { error: "No subtitles found" },
//         { status: 404 }
//       );
//     }

//     // Read the content of the found subtitle file
//     const subtitlePath = path.join(DOWNLOAD_DIR, files[0]);
//     const vttContent = fs.readFileSync(subtitlePath, "utf-8");

//     // --- PARSE THE CONTENT ---
//     // Instead of returning the raw string, parse it into structured data
//     const parsedSubtitles = parseVTT(vttContent);

//     return NextResponse.json({ subtitles: parsedSubtitles });
//   } catch (err: any) {
//     console.error("Error in get-subs API:", err.message);
//     return NextResponse.json(
//       { error: "An unexpected error occurred." },
//       { status: 500 }
//     );
//   } finally {
//     // --- CLEANUP STEP ---
//     // This block will run after the try/catch, ensuring files are deleted.
//     if (fs.existsSync(DOWNLOAD_DIR)) {
//       const filesToDelete = fs.readdirSync(DOWNLOAD_DIR);
//       for (const file of filesToDelete) {
//         // Delete all temporary files to keep the directory clean
//         if (file.startsWith("temp_")) {
//           fs.unlinkSync(path.join(DOWNLOAD_DIR, file));
//         }
//       }
//     }
//   }
// }

// app/api/get_subs/route.ts
import { NextResponse } from "next/server";
import { createRequire } from "module";
import path from "path";
import fs from "fs";
import os from "os";

const require = createRequire(import.meta.url);
const youtubedl = require("youtube-dl-exec");

const DOWNLOAD_DIR = path.join(os.tmpdir(), "yt-subs-downloads");

type SubtitleCue = {
  start: string;
  text: string;
};

/**
 * Parses raw VTT content, cleans up rolling duplicates, and stitches overlapping lines.
 * @param vttContent The raw VTT string.
 * @returns A de-duplicated and stitched array of SubtitleCue objects.
 */
function parseVTT(vttContent: string): SubtitleCue[] {
  // --- Step 0: Initial Raw Parsing ---
  const rawCues: SubtitleCue[] = [];
  const blocks = vttContent.trim().split("\n\n");

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const lines = block.split("\n");
    if (lines.length < 2) continue;

    const timestampLine = lines[0];
    if (timestampLine.includes("-->")) {
      const startTime = timestampLine.split(" --> ")[0];
      const text = lines
        .slice(1)
        .join(" ")
        .replace(/<[^>]+>/g, "")
        .trim();
      if (text) {
        rawCues.push({ start: startTime, text });
      }
    }
  }
  if (rawCues.length === 0) return [];

  // --- Step 1: Filter out "Rolling Updates" ---
  // A rolling update is when a line is just a prefix of the next line. We only want the final, most complete version.
  const filteredCues = rawCues.filter((cue, index, arr) => {
    const nextCue = arr[index + 1];
    // Keep the cue if it's the last one, or if it's not a prefix of the next one.
    return !nextCue || !nextCue.text.startsWith(cue.text);
  });

  // --- Step 2: Stitch "Handoff" Overlaps ---
  // This handles cases where the end of one line is repeated at the start of the next.
  // We modify the text of the cues in the filtered list.
  for (let i = 0; i < filteredCues.length - 1; i++) {
    const currentCue = filteredCues[i];
    const nextCue = filteredCues[i + 1];

    let overlap = "";
    // Find the longest string that is a suffix of the current line and a prefix of the next line.
    for (
      let j = Math.min(currentCue.text.length, nextCue.text.length);
      j > 0;
      j--
    ) {
      const suffix = currentCue.text.slice(-j);
      const prefix = nextCue.text.slice(0, j);
      if (suffix === prefix) {
        overlap = suffix;
        break; // Found the longest possible overlap
      }
    }

    // If a significant overlap is found, trim it from the end of the current line.
    if (overlap.length > 5 || overlap.split(" ").length > 1) {
      currentCue.text = currentCue.text.slice(0, -overlap.length);
    }
  }

  // Return the fully cleaned list, removing any cues that became empty after trimming.
  return filteredCues.filter((cue) => cue.text.trim() !== "");
}

export async function POST(req: Request) {
  try {
    const { youtubeUrl } = await req.json();
    if (!youtubeUrl) {
      return NextResponse.json(
        { error: "No YouTube URL provided" },
        { status: 400 }
      );
    }

    if (!fs.existsSync(DOWNLOAD_DIR)) {
      fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
    }

    await youtubedl(youtubeUrl, {
      writeAutoSub: true,
      subLang: "en",
      skipDownload: true,
      output: path.join(DOWNLOAD_DIR, "temp_%(id)s"),
    });

    const files = fs
      .readdirSync(DOWNLOAD_DIR)
      .filter((f) => f.endsWith(".vtt"));

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No subtitles found" },
        { status: 404 }
      );
    }

    const subtitlePath = path.join(DOWNLOAD_DIR, files[0]);
    const vttContent = fs.readFileSync(subtitlePath, "utf-8");

    const parsedSubtitles = parseVTT(vttContent);

    return NextResponse.json({ subtitles: parsedSubtitles });
  } catch (err: any) {
    console.error("Error in get-subs API:", err.message);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  } finally {
    if (fs.existsSync(DOWNLOAD_DIR)) {
      const filesToDelete = fs.readdirSync(DOWNLOAD_DIR);
      for (const file of filesToDelete) {
        if (file.startsWith("temp_")) {
          fs.unlinkSync(path.join(DOWNLOAD_DIR, file));
        }
      }
    }
  }
}
