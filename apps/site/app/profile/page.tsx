"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { authClient, useSession } from "@/lib/auth-client";
import { apiClient, apiRequest } from "@/lib/api-client";
import { avatarColor } from "@/lib/avatar";

export default function ProfilePage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace("/sign-in?redirect=%2Fprofile");
      return;
    }
    if (session?.user) {
      setName(session.user.name ?? "");
      setAvatar(session.user.image ?? null);
    }
  }, [isPending, router, session]);

  async function refreshSessionAndPage() {
    await authClient.getSession();
  }

  async function handleNameUpdate() {
    const normalized = name.trim();
    if (normalized.length < 2 || normalized.length > 32) {
      toast.error("Name must be between 2 and 32 characters.");
      return;
    }

    setSavingName(true);
    try {
      const data = await apiRequest(
        apiClient.api.profile.$patch({
          json: { name: normalized },
        }),
        "Failed to update name",
      );
      setName(data.user.name);
      await refreshSessionAndPage();
      toast.success("Name updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update name");
    } finally {
      setSavingName(false);
    }
  }

  async function handleAvatarUpload(file: File) {
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const data = await apiRequest(
        apiClient.api.profile.avatar.$post({}, {
          init: {
            body: formData,
          },
        }),
        "Failed to upload avatar",
      );
      setAvatar(data.image);
      await refreshSessionAndPage();
      toast.success("Avatar updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handlePasswordUpdate() {
    if (!currentPassword || !newPassword) {
      toast.error("Enter both your current password and new password.");
      return;
    }
    if (newPassword.length < 8 || newPassword.length > 72) {
      toast.error("New password must be between 8 and 72 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("The new passwords do not match.");
      return;
    }

    setUpdatingPassword(true);
    try {
      const data = await apiRequest(
        apiClient.api.profile.password.$post({
          json: {
            currentPassword,
            newPassword,
          },
        }),
        "Failed to update password",
      );
      if (!data.success) {
        throw new Error("Failed to update password");
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setUpdatingPassword(false);
    }
  }

  if (isPending || !session?.user) {
    return <div className="py-16 text-center text-sm text-neutral-500">Loading...</div>;
  }

  return (
    <div className="mx-auto w-full max-w-2xl py-10">
      <h1 className="mb-6 text-2xl font-semibold text-neutral-900">Profile</h1>

      <section className="mb-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-medium text-neutral-900">Avatar</h2>
        <div className="flex items-center gap-4">
          {avatar ? (
            <Image
              src={avatar}
              alt="avatar"
              width={80}
              height={80}
              className="h-20 w-20 rounded-full border object-cover"
            />
          ) : (
            <div
              className="flex size-16 items-center justify-center rounded-full text-2xl font-semibold text-white select-none"
              style={{ backgroundColor: avatarColor(session.user.email) }}
            >
              {(session.user.name ?? session.user.email).trim().slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  void handleAvatarUpload(file);
                }
                e.currentTarget.value = "";
              }}
            />
            <button
              type="button"
              disabled={uploadingAvatar}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex w-fit items-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploadingAvatar ? "Uploading..." : avatar ? "Change avatar" : "Upload avatar"}
            </button>
            <p className="text-xs text-neutral-500">Supports jpg/png/webp/gif up to 2MB.</p>
          </div>
        </div>
      </section>

      <section className="mb-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-medium text-neutral-900">Name</h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 px-4 py-2.5 text-sm text-neutral-900 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-100"
            placeholder="Enter your name"
          />
          <button
            type="button"
            disabled={savingName}
            onClick={() => void handleNameUpdate()}
            className="inline-flex h-[42px] min-w-[104px] items-center justify-center whitespace-nowrap rounded-lg bg-neutral-900 px-4 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savingName ? "Saving..." : "Save name"}
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-medium text-neutral-900">Update password</h2>
        <div className="grid gap-3">
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 px-4 py-2.5 text-sm text-neutral-900 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-100"
            placeholder="Current password"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 px-4 py-2.5 text-sm text-neutral-900 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-100"
            placeholder="New password (8-72 characters)"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 px-4 py-2.5 text-sm text-neutral-900 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-100"
            placeholder="Confirm new password"
          />
          <button
            type="button"
            disabled={updatingPassword}
            onClick={() => void handlePasswordUpdate()}
            className="mt-1 inline-flex h-[42px] items-center justify-center rounded-lg bg-neutral-900 px-4 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {updatingPassword ? "Updating..." : "Update password"}
          </button>
        </div>
      </section>
    </div>
  );
}
