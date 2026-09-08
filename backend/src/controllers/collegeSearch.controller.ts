import { Request, Response, NextFunction } from "express";
import { INDIAN_COLLEGES_DIRECTORY, CollegeDataEntry } from "../data/collegeDirectory.dataset.js";
import { ApiResponse } from "../utils/apiResponse.js";

export class CollegeSearchController {
  static async searchColleges(req: Request, res: Response, next: NextFunction) {
    try {
      const query = typeof req.query.q === "string" ? req.query.q.trim() : "";

      if (!query) {
        // Return top featured institutions if search is empty
        const defaultResults = INDIAN_COLLEGES_DIRECTORY.slice(0, 10);
        return res.status(200).json(ApiResponse.success("Featured institutions directory", defaultResults));
      }

      const qLower = query.toLowerCase();

      // 1. Search Local Curated Directory with relevance scoring
      const localMatchesWithScore: { entry: CollegeDataEntry; score: number }[] = [];

      for (const item of INDIAN_COLLEGES_DIRECTORY) {
        let score = 0;

        // Exact match on abbreviation/alias (e.g. "KNIT", "REC", "IITK", "HBTU")
        const hasExactAlias = item.aliases.some(a => a.toLowerCase() === qLower);
        if (hasExactAlias) {
          score += 100;
        }

        // Prefix match on alias or name
        const hasPrefixAlias = item.aliases.some(a => a.toLowerCase().startsWith(qLower));
        const nameStartsWith = item.name.toLowerCase().startsWith(qLower);
        if (hasPrefixAlias || nameStartsWith) {
          score += 80;
        }

        // Substring match on name
        if (item.name.toLowerCase().includes(qLower)) {
          score += 60;
        }

        // Substring match on aliases
        const hasSubstringAlias = item.aliases.some(a => a.toLowerCase().includes(qLower));
        if (hasSubstringAlias) {
          score += 50;
        }

        // City/State match
        if (item.city.toLowerCase().includes(qLower) || item.state.toLowerCase().includes(qLower)) {
          score += 40;
        }

        if (score > 0) {
          localMatchesWithScore.push({ entry: item, score });
        }
      }

      // Sort local results by score descending
      localMatchesWithScore.sort((a, b) => b.score - a.score);
      const results: CollegeDataEntry[] = localMatchesWithScore.map(m => m.entry);

      // 2. Fallback to Hipolabs Open Universities API if local results are few and query length >= 3
      if (results.length < 5 && query.length >= 3) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1800);

          const apiRes = await fetch(
            `http://universities.hipolabs.com/search?country=India&name=${encodeURIComponent(query)}`,
            { signal: controller.signal }
          );
          clearTimeout(timeoutId);

          if (apiRes.ok) {
            const apiData = (await apiRes.json()) as any;
            if (Array.isArray(apiData)) {
              for (const item of apiData) {
                if (!item.name) continue;
                const exists = results.some(r => r.name.toLowerCase() === item.name.toLowerCase());
                if (!exists) {
                  const state = item["state-province"] || "India";
                  const website = Array.isArray(item.web_pages) && item.web_pages[0] ? item.web_pages[0] : "";
                  const code = item.name
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, "-")
                    .replace(/-+/g, "-")
                    .slice(0, 30);

                  results.push({
                    name: item.name,
                    aliases: [item.name],
                    type: "Recognized University / Institute",
                    city: state !== "India" ? state : "India",
                    state: state,
                    website: website,
                    collegeCode: code,
                    isRecognized: true,
                  });
                }
              }
            }
          }
        } catch {
          // Ignore external API failure and return local matched directory
        }
      }

      return res.status(200).json(ApiResponse.success("Institution search results", results.slice(0, 15)));
    } catch (error) {
      next(error);
    }
  }
}
