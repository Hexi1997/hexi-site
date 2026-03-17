"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error: err } = await authClient.signUp.email({
          email,
          password,
          name: name.trim() || email.split("@")[0] || "用户",
          callbackURL: "/",
        });
        if (err) {
          setError(String(err.message ?? "注册失败"));
          return;
        }
        if (data) router.push("/");
      } else {
        const { data, error: err } = await authClient.signIn.email({
          email,
          password,
          callbackURL: "/",
        });
        if (err) {
          setError(String(err.message ?? "登录失败"));
          return;
        }
        if (data) router.push("/");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm py-12">
      <h1 className="mb-6 text-xl font-semibold">
        {isSignUp ? "注册" : "登录"}
      </h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {isSignUp && (
          <div>
            <label htmlFor="name" className="mb-1 block text-sm text-neutral-600">
              昵称（选填）
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
        )}
        <div>
          <label htmlFor="email" className="mb-1 block text-sm text-neutral-600">
            邮箱
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm text-neutral-600">
            密码
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {loading ? "提交中…" : isSignUp ? "注册" : "登录"}
        </button>
      </form>
      <p className="mt-4 text-sm text-neutral-500">
        {isSignUp ? "已有账号？" : "还没有账号？"}
        <button
          type="button"
          onClick={() => {
            setIsSignUp((v) => !v);
            setError(null);
          }}
          className="ml-1 font-medium text-neutral-700 hover:underline"
        >
          {isSignUp ? "去登录" : "去注册"}
        </button>
      </p>
    </div>
  );
}
