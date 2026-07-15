"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "../../utils/api";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [fullname, setFullname] = useState("");
  const [password, setPassword] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("What is your favorite pet name?");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [registered, setRegistered] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await apiFetch("/WoahCab/users/register", {
        method: "POST",
        body: JSON.stringify({
          username,
          fullname,
          password,
          securityQuestion,
          securityAnswer,
        }),
      });

      if (response?.data?.backupCodes) {
        setBackupCodes(response.data.backupCodes);
        setRegistered(true);
      } else {
        router.push("/login");
      }
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const securityQuestions = [
    "What is your favorite pet name?",
    "What was the name of your first elementary school?",
    "In what city or town did your parents meet?",
    "What was the make and model of your first car?",
    "What is your mother's maiden name?",
  ];

  if (registered) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-background text-slate-900 dark:text-slate-100 px-4 py-12 transition-colors duration-300">
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-emerald-600/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-violet-600/10 blur-[120px]" />

        <div className="w-full max-w-md relative z-10">
          <div className="backdrop-blur-xl bg-card border border-border rounded-3xl p-8 shadow-2xl text-center">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-450 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold mb-2">Registration Successful</h1>
            <p className="text-slate-650 dark:text-slate-400 text-sm mb-6 font-medium">
              Save your backup codes securely. You can use these to reset your password if you ever forget it. They will not be shown again.
            </p>

            <div className="grid grid-cols-3 gap-3 mb-8">
              {backupCodes.map((code, idx) => (
                <div
                  key={idx}
                  className="bg-background border border-border px-3 py-4 rounded-xl text-indigo-650 dark:text-indigo-400 font-mono text-sm font-bold tracking-wider select-all shadow-sm"
                >
                  {code}
                </div>
              ))}
            </div>

            <button
              onClick={() => router.push("/login")}
              className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-2xl transition-all duration-300 shadow-lg shadow-emerald-600/10 active:scale-95 cursor-pointer"
            >
              Continue to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background text-slate-900 dark:text-slate-100 overflow-hidden px-4 py-12 transition-colors duration-300">
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-violet-600/10 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-600/10 blur-[120px]" />

      <div className="w-full max-w-md relative z-10">
        <div className="backdrop-blur-xl bg-card border border-border rounded-3xl p-8 shadow-2xl transition-all duration-300 hover:border-violet-500/20">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400 bg-clip-text text-transparent">
              Create Account
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm font-medium">
              Start building your vocabulary bank today.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-650 dark:text-red-400 text-sm text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider mb-2">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                placeholder="e.g. Anurag Nidhi"
                className="w-full px-4 py-3 bg-background border border-border rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider mb-2">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. anurag"
                className="w-full px-4 py-3 bg-background border border-border rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider mb-2">
                Password (min 8 chars)
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-background border border-border rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider mb-2">
                Security Question
              </label>
              <select
                value={securityQuestion}
                onChange={(e) => setSecurityQuestion(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-2xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all text-sm font-semibold"
              >
                {securityQuestions.map((q, idx) => (
                  <option key={idx} value={q} className="bg-background text-slate-900 dark:text-slate-100">
                    {q}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider mb-2">
                Security Answer
              </label>
              <input
                type="text"
                required
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
                placeholder="Your Answer"
                className="w-full px-4 py-3 bg-background border border-border rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all text-sm font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-violet-500/50 hover:shadow-lg hover:shadow-violet-600/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none text-sm mt-2 cursor-pointer"
            >
              {loading ? "Registering..." : "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-550 dark:text-slate-400 font-semibold">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-violet-600 dark:text-violet-400 font-bold hover:underline transition-colors ml-1"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
