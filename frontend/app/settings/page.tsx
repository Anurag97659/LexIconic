"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import { apiFetch } from "../../utils/api";

interface UserProfile {
  _id: string;
  username: string;
  fullname: string;
  securityQuestion: string;
  createdAt: string;
}

export default function SettingsPage() {
  const router = useRouter();
  
  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Change Details form state
  const [newUsername, setNewUsername] = useState("");
  const [newFullname, setNewFullname] = useState("");
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [detailsSuccess, setDetailsSuccess] = useState("");

  // Change Password form state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Delete account state
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    // Fetch profile on mount
    apiFetch("/WoahCab/users/getProfile")
      .then((res) => {
        if (res?.data) {
          setProfile(res.data);
          setNewUsername(res.data.username);
          setNewFullname(res.data.fullname);
        }
      })
      .catch((err) => {
        // Redirect to login if unauthorized
        router.push("/login");
      })
      .finally(() => {
        setProfileLoading(false);
      });
  }, [router]);

  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setDetailsLoading(true);
    setDetailsError("");
    setDetailsSuccess("");

    try {
      const res = await apiFetch("/WoahCab/users/updateDetails", {
        method: "POST",
        body: JSON.stringify({
          username: newUsername,
          fullname: newFullname,
        }),
      });
      if (res?.data) {
        setProfile(res.data);
        setDetailsSuccess("Details updated successfully!");
      }
    } catch (err: any) {
      setDetailsError(err.message || "Failed to update details");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }
    setPasswordLoading(true);
    setPasswordError("");
    setPasswordSuccess("");

    try {
      await apiFetch("/WoahCab/users/changePassword", {
        method: "POST",
        body: JSON.stringify({
          oldPassword,
          newPassword,
          confirmPassword,
        }),
      });
      setPasswordSuccess("Password updated successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordError(err.message || "Failed to update password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = window.confirm(
      "WARNING: This action is permanent! Are you sure you want to delete your account? All your generated words will remain, but you will lose access to this account forever."
    );
    if (!confirmation) return;

    setDeleteLoading(true);
    setDeleteError("");

    try {
      await apiFetch("/WoahCab/users/delete", {
        method: "POST",
      });
      router.push("/login");
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete account");
      setDeleteLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-300">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-t-violet-500 border-indigo-500/10 animate-spin" />
            <span className="text-text-muted text-sm">Loading settings...</span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-300">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-8 space-y-8 relative">
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-violet-650/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-650/5 blur-[120px] pointer-events-none" />

        {/* Header */}
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight">Account Settings</h1>
          <p className="text-text-muted text-sm mt-1">
            Manage your credentials, profile details, and security configuration.
          </p>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          
          {/* Column 1: Profile Summary Card */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
              <div className="flex flex-col items-center text-center pb-6 border-b border-border">
                <div className="w-20 h-20 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-black mb-4 shadow-lg shadow-violet-600/20 capitalize select-none">
                  {profile?.fullname.charAt(0)}
                </div>
                <h2 className="text-lg font-bold truncate max-w-full">
                  {profile?.fullname}
                </h2>
                <p className="text-sm text-text-muted font-mono truncate max-w-full mt-1">
                  @{profile?.username}
                </p>
              </div>

              <div className="pt-6 space-y-4 text-xs font-semibold text-text-muted">
                <div>
                  <span className="block text-[10px] uppercase text-slate-400 dark:text-slate-500 mb-1">
                    Security Question
                  </span>
                  <span className="text-foreground italic">
                    "{profile?.securityQuestion}"
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase text-slate-400 dark:text-slate-500 mb-1">
                    Member Since
                  </span>
                  <span className="text-foreground">
                    {profile ? new Date(profile.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }) : ""}
                  </span>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-500/5 border border-red-550/10 rounded-3xl p-6 space-y-4">
              <div>
                <h3 className="text-red-600 dark:text-red-400 font-bold text-sm">Danger Zone</h3>
                <p className="text-text-muted text-xs mt-1">
                  Permanently erase your account and credentials from the system.
                </p>
              </div>

              {deleteError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 dark:text-red-400 text-xs text-center">
                  {deleteError}
                </div>
              )}

              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl text-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {deleteLoading ? "Deleting Account..." : "Delete Account"}
              </button>
            </div>
          </div>

          {/* Column 2: Edit Forms */}
          <div className="md:col-span-2 space-y-8">
            
            {/* Change Profile Details Form */}
            <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
              <h3 className="text-lg font-bold mb-1">Update Details</h3>
              <p className="text-xs text-text-muted mb-6">
                Change your display name and login username.
              </p>

              {detailsError && (
                <div className="mb-4 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 dark:text-red-400 text-xs text-center animate-fade-in">
                  {detailsError}
                </div>
              )}

              {detailsSuccess && (
                <div className="mb-4 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs text-center animate-fade-in">
                  {detailsSuccess}
                </div>
              )}

              <form onSubmit={handleUpdateDetails} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newFullname}
                      onChange={(e) => setNewFullname(e.target.value)}
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-505 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      required
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={detailsLoading}
                    className="py-3 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium rounded-xl text-xs transition-all duration-300 disabled:opacity-50 active:scale-95 cursor-pointer"
                  >
                    {detailsLoading ? "Saving Changes..." : "Save Details"}
                  </button>
                </div>
              </form>
            </div>

            {/* Change Password Form */}
            <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
              <h3 className="text-lg font-bold mb-1">Change Password</h3>
              <p className="text-xs text-text-muted mb-6">
                Update your login password securely.
              </p>

              {passwordError && (
                <div className="mb-4 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 dark:text-red-400 text-xs text-center animate-fade-in">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="mb-4 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs text-center animate-fade-in">
                  {passwordSuccess}
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all text-sm font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      New Password (min 8 chars)
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-505 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="py-3 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium rounded-xl text-xs transition-all duration-300 disabled:opacity-50 active:scale-95 cursor-pointer"
                  >
                    {passwordLoading ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
