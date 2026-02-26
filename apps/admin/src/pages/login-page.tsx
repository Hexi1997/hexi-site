import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

export function LoginPage() {
  const { login } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setChecking(true);

    const result = await login(password);
    if (!result.ok) {
      setError(result.error || "Login failed");
      setPassword("");
    }
    setChecking(false);
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-xl border bg-card p-8 shadow-sm"
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold">Blog Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter password to continue
          </p>
        </div>
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        {error && (
          <p className="text-center text-sm text-destructive">{error}</p>
        )}
        <Button type="submit" disabled={!password || checking}>
          {checking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign in
        </Button>
      </form>
    </div>
  );
}
