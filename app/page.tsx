// // app/page.tsx
// "use client";

// import { useState } from "react";
// import ReactMarkdown from "react-markdown";

// export default function HomePage() {
//   const [url, setUrl] = useState("");
//   const [subtitles, setSubtitles] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setError("");
//     setSubtitles("");

//     try {
//       const res = await fetch("/api/get_subs", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ youtubeUrl: url }),
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data.error || "Failed to fetch subtitles");

//       setSubtitles(cleanVTT(data.subtitles));
//     } catch (err: any) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Clean VTT function to get only the text
//   function cleanVTT(vtt: string): string {
//     return vtt
//       .split("\n")
//       .filter(
//         (line) =>
//           !line.match(/-->/) &&
//           line.trim() !== "" &&
//           !line.startsWith("WEBVTT") &&
//           !line.startsWith("Kind:") &&
//           !line.startsWith("Language:")
//       )
//       .map((line) => line.replace(/<[^>]+>/g, "")) // Remove all tags
//       .join(" ")
//       .replace(/\s+/g, " ")
//       .trim();
//   }

//   return (
//     <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
//       <div className="w-full max-w-2xl mx-auto">
//         <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8">
//           <div className="text-center mb-8">
//             <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
//               YouTube Subtitle Extractor
//             </h1>
//             <p className="text-gray-500 dark:text-gray-400 mt-2">
//               Paste a YouTube URL below to get its subtitles.
//             </p>
//           </div>

//           <form onSubmit={handleSubmit} className="space-y-4">
//             <input
//               type="text"
//               placeholder="https://www.youtube.com/watch?v=..."
//               value={url}
//               onChange={(e) => setUrl(e.target.value)}
//               className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-shadow"
//             />
//             <button
//               type="submit"
//               disabled={loading || !url}
//               className="w-full px-4 py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-blue-500/50 transition-colors"
//             >
//               {loading ? "Fetching..." : "Get Subtitles"}
//             </button>
//           </form>

//           {error && (
//             <p className="mt-4 text-center text-red-500 dark:text-red-400">
//               Error: {error}
//             </p>
//           )}
//         </div>

//         {subtitles && (
//           <div className="mt-8 bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8">
//             <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
//               Subtitles
//             </h2>
//             <article className="prose prose-lg dark:prose-invert max-w-none">
//               <ReactMarkdown>{subtitles}</ReactMarkdown>
//             </article>
//           </div>
//         )}
//       </div>
//     </main>
//   );
// }

// app/page.tsx
"use client";

import { useState } from "react";

// Define an interface for the subtitle object for type safety
interface SubtitleCue {
  start: string;
  text: string;
}

export default function HomePage() {
  const [url, setUrl] = useState("");
  // The 'subtitles' state will now hold an array of SubtitleCue objects
  const [subtitles, setSubtitles] = useState<SubtitleCue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSubtitles([]); // Clear previous results

    try {
      const res = await fetch("/api/get_subs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtubeUrl: url }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch subtitles");

      // The data from the API is already parsed
      setSubtitles(data.subtitles);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format the timestamp for display (e.g., from 00:01:23.456 to 01:23)
  const formatTimestamp = (timestamp: string): string => {
    const parts = timestamp.split(":");
    if (parts.length === 3) {
      return `${parts[1]}:${parts[2].split(".")[0]}`; // Returns MM:SS
    }
    return timestamp;
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4 font-sans">
      <div className="w-full max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              YouTube Subtitle Extractor
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Paste a YouTube URL below to get its transcribed subtitles with
              timestamps.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-shadow"
            />
            <button
              type="submit"
              disabled={loading || !url}
              className="w-full px-4 py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-blue-500/50 transition-colors"
            >
              {loading ? "Fetching..." : "Get Subtitles"}
            </button>
          </form>

          {error && (
            <p className="mt-4 text-center text-red-500 dark:text-red-400">
              Error: {error}
            </p>
          )}
        </div>

        {subtitles.length > 0 && (
          <div className="mt-8 bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Transcription
            </h2>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {subtitles.map((cue, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50"
                >
                  <p className="text-sm font-mono text-blue-500 dark:text-blue-400 whitespace-nowrap pt-1">
                    {formatTimestamp(cue.start)}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {cue.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
