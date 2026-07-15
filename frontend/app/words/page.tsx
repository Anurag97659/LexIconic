"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import { apiFetch } from "../../utils/api";

interface Definition {
  partOfSpeech: string;
  definition: string;
}

interface WordItem {
  _id: string;
  word: string;
  definitions: Definition[];
  synonyms: string[];
  antonyms: string[];
  examples: string[];
  createdBy?: {
    _id: string;
    username: string;
  };
}

export default function WordListPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ _id: string; username: string } | null>(null);
  const [words, setWords] = useState<WordItem[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "mine">("all");
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState("");

  // 1. Fetch current user profile on mount
  useEffect(() => {
    apiFetch("/WoahCab/users/getProfile")
      .then((res) => {
        if (res?.data) {
          setCurrentUser(res.data);
        }
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // 2. Debounced API Semantic Search
  useEffect(() => {
    // If query is empty, fetch all words
    if (!search.trim()) {
      setSearchLoading(false);
      apiFetch("/WoahCab/words/getwords")
        .then((res) => {
          if (res?.data) {
            setWords(res.data);
          }
        })
        .catch((err) => {
          setError(err.message || "Failed to load vocabulary");
          if (err.message?.includes("Unauthorized") || err.message?.includes("401")) {
            router.push("/login");
          }
        });
      return;
    }

    setSearchLoading(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await apiFetch(`/WoahCab/words/search?q=${encodeURIComponent(search.trim())}`);
        if (res?.data) {
          setWords(res.data);
        }
      } catch (err: any) {
        console.error("Semantic search failed:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 600); // 600ms debounce to give natural typing space

    return () => clearTimeout(delayDebounce);
  }, [search, router]);

  // 3. Apply local ownership filter on words
  const filteredWords = words.filter((item) => {
    if (filterType === "mine") {
      if (!currentUser || !item.createdBy || item.createdBy._id !== currentUser._id) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-300">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8">
        
        {/* Dashboard Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Your Vocabulary Bank</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 font-medium">
              Browse, search, and manage words generated via Gemini AI.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Toggle Switch: All vs My Words */}
            <div className="flex gap-1.5 p-1 bg-card border border-border rounded-2xl w-fit shrink-0 shadow-sm">
              <button
                type="button"
                onClick={() => setFilterType("all")}
                className={`py-2 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  filterType === "all"
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-450 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                All Words
              </button>
              <button
                type="button"
                onClick={() => setFilterType("mine")}
                className={`py-2 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  filterType === "mine"
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-450 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                My Words
              </button>
            </div>

            {/* Search Input (with loading indicator) */}
            <div className="relative flex-1 sm:w-80">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                {searchLoading ? (
                  <div className="w-4 h-4 rounded-full border-2 border-t-violet-500 border-indigo-500/10 animate-spin" />
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </span>
              <input
                type="text"
                placeholder="Ask Google-like semantic query (e.g. lasts very short time)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-450 dark:placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all text-sm font-semibold"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm text-center font-medium">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="bg-card border border-border rounded-3xl p-6 h-48 animate-pulse flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="h-6 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                  <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                  <div className="h-4 w-4/6 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                </div>
                <div className="h-5 w-1/4 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              </div>
            ))}
          </div>
        ) : filteredWords.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWords.map((item) => {
              const isMine = currentUser && item.createdBy && item.createdBy._id === currentUser._id;
              return (
                <Link
                  key={item._id}
                  href={`/words/${item._id}`}
                  className="group flex flex-col justify-between bg-card hover:bg-card-hover border border-border rounded-3xl p-6 shadow-lg transition-all duration-300 hover:shadow-violet-650/5 hover:-translate-y-0.5 cursor-pointer relative overflow-hidden"
                >
                  {/* Subtle color highlight if it's user's own word */}
                  {isMine && (
                    <div className="absolute top-0 right-0 w-3 h-3 bg-violet-650 rounded-bl-lg" />
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-violet-650 dark:group-hover:text-violet-400 transition-colors capitalize">
                        {item.word}
                      </h2>
                      {item.createdBy && (
                        <span className="text-[10px] bg-background border border-border px-2.5 py-1 rounded-lg text-slate-500 dark:text-slate-455 font-bold uppercase tracking-wider">
                          @{item.createdBy.username}
                        </span>
                      )}
                    </div>

                    <p className="text-slate-650 dark:text-slate-400 text-sm line-clamp-2 mb-4 leading-relaxed font-semibold">
                      {item.definitions[0]?.definition || "No definition available."}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-4 border-t border-border">
                    {Array.from(new Set(item.definitions.map((d) => d.partOfSpeech))).map((pos) => (
                      <span
                        key={pos}
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-violet-600/10 text-violet-650 dark:text-violet-400 border border-violet-500/10"
                      >
                        {pos}
                      </span>
                    ))}
                    {item.synonyms.length > 0 && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-500/5 text-indigo-650 dark:text-indigo-400 border border-indigo-500/5 ml-auto">
                        {item.synonyms.length} synonyms
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="backdrop-blur-xl bg-card border border-border rounded-3xl p-16 text-center shadow-xl max-w-lg mx-auto mt-12 animate-fade-in">
            <div className="w-16 h-16 bg-background border border-border text-slate-450 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">No Words Found</h2>
            <p className="text-slate-550 dark:text-slate-450 text-sm mb-8 font-semibold">
              {search 
                ? "No matching vocabulary found. Try another description!" 
                : filterType === "mine"
                  ? "You haven't generated any words yet. Switch back to 'All Words' or submit a new word!"
                  : "Your vocabulary bank is empty. Get started by adding your first word!"}
            </p>
            {(!search && filterType === "all") && (
              <Link
                href="/words/submit"
                className="py-3.5 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-violet-600/10 active:scale-95"
              >
                Add Your First Word
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
