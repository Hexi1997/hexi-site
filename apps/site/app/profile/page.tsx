"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { authClient, useSession } from "@/lib/auth-client";

const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL ?? "";

type ProfileUser = {
  id: string;
  email: string;
  name: string;
  image: string | null;
};

async function requestProfileAPI<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${AUTH_API_URL}${path}`, {
    ...init,
    credentials: "include",
  });

  const data = await response.json().catch(() => null) as Record<string, unknown> | null;
  if (!response.ok) {
    const error = data && typeof data.error === "string" ? data.error : "请求失败";
    throw new Error(error);
  }

  return data as T;
}

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
      toast.error("用户名长度需在 2-32 字符之间");
      return;
    }

    setSavingName(true);
    try {
      const data = await requestProfileAPI<{ user: ProfileUser }>("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: normalized }),
      });
      setName(data.user.name);
      await refreshSessionAndPage();
      toast.success("用户名已更新");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "用户名更新失败");
    } finally {
      setSavingName(false);
    }
  }

  async function handleAvatarUpload(file: File) {
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const data = await requestProfileAPI<{ image: string }>("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });
      setAvatar(data.image);
      await refreshSessionAndPage();
      toast.success("头像已更新");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "头像上传失败");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handlePasswordUpdate() {
    if (!currentPassword || !newPassword) {
      toast.error("请填写当前密码与新密码");
      return;
    }
    if (newPassword.length < 8 || newPassword.length > 72) {
      toast.error("新密码长度需在 8-72 字符之间");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("两次输入的新密码不一致");
      return;
    }

    setUpdatingPassword(true);
    try {
      await requestProfileAPI<{ success: boolean }>("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("密码已更新");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "密码更新失败");
    } finally {
      setUpdatingPassword(false);
    }
  }

  if (isPending || !session?.user) {
    return <div className="py-16 text-center text-sm text-neutral-500">加载中...</div>;
  }

  return (
    <div className="mx-auto w-full max-w-2xl py-10">
      <h1 className="mb-6 text-2xl font-semibold text-neutral-900">Profile</h1>

      <section className="mb-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-medium text-neutral-900">头像</h2>
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
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100 text-xl font-semibold text-neutral-500">
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
              {uploadingAvatar ? "上传中..." : avatar ? "更换头像" : "上传头像"}
            </button>
            <p className="text-xs text-neutral-500">支持 jpg/png/webp/gif，大小不超过 2MB</p>
          </div>
        </div>
      </section>

      <section className="mb-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-medium text-neutral-900">用户名</h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 px-4 py-2.5 text-sm text-neutral-900 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-100"
            placeholder="请输入用户名"
          />
          <button
            type="button"
            disabled={savingName}
            onClick={() => void handleNameUpdate()}
            className="inline-flex h-[42px] min-w-[104px] items-center justify-center whitespace-nowrap rounded-lg bg-neutral-900 px-4 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savingName ? "保存中..." : "保存用户名"}
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-medium text-neutral-900">更新密码</h2>
        <div className="grid gap-3">
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 px-4 py-2.5 text-sm text-neutral-900 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-100"
            placeholder="当前密码"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 px-4 py-2.5 text-sm text-neutral-900 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-100"
            placeholder="新密码（8-72 字符）"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 px-4 py-2.5 text-sm text-neutral-900 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-100"
            placeholder="确认新密码"
          />
          <button
            type="button"
            disabled={updatingPassword}
            onClick={() => void handlePasswordUpdate()}
            className="mt-1 inline-flex h-[42px] items-center justify-center rounded-lg bg-neutral-900 px-4 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {updatingPassword ? "更新中..." : "更新密码"}
          </button>
        </div>
      </section>
    </div>
  );
}
