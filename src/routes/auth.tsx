import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Admin Sign In — GPCLUB Vietnam" }] }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email("Invalid email").max(200),
  password: z.string().min(6, "Min 6 characters").max(100),
});

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecoveryMode(true);
    });

    supabase.auth.getSession().then(({ data }) => {
      const isRecovery =
        window.location.hash.includes("type=recovery") ||
        window.location.search.includes("type=recovery");
      if (isRecovery) {
        setRecoveryMode(true);
        return;
      }
      if (data.session) navigate({ to: "/admin" });
    });

    return () => listener.subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const t = window.setTimeout(() => emailRef.current?.focus(), 250);
    return () => window.clearTimeout(t);
  }, []);

  const handle = async (mode: "signin" | "signup") => {
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Welcome back");
        navigate({ to: "/admin" });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) throw error;
        toast.success("Account created — check your email to confirm.");
      }
    } catch (e) {
      toast.error(getErrorMessage(e, "Authentication failed"));
    } finally {
      setLoading(false);
    }
  };

  const sendResetEmail = async () => {
    const parsed = z.string().trim().email("Invalid email").safeParse(email);
    if (!parsed.success) {
      toast.error("Enter your admin email first");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;
      toast.success("Password reset email sent. Please check your inbox.");
    } catch (e) {
      toast.error(getErrorMessage(e, "Could not send reset email"));
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async () => {
    const parsed = z.string().min(6, "Min 6 characters").max(100).safeParse(password);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: parsed.data,
      });
      if (error) throw error;
      toast.success("Password updated. Redirecting to admin.");
      navigate({ to: "/admin" });
    } catch (e) {
      toast.error(getErrorMessage(e, "Could not update password"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto flex min-h-screen max-w-md items-center px-4 py-16 sm:px-6">
      <div className="w-full rounded-3xl border border-border/60 bg-card p-8 shadow-soft">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-navy text-primary-foreground">
            <Lock className="h-4 w-4" />
          </span>
          <div>
            <h1 className="font-display text-2xl">Admin Portal</h1>
            <p className="text-xs text-muted-foreground">Sign in to manage inquiries</p>
          </div>
        </div>

        {recoveryMode ? (
          <div className="mt-6 space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                New password
              </Label>
              <Input
                className="mt-1.5 h-11"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={100}
                autoComplete="new-password"
              />
            </div>
            <Button onClick={updatePassword} disabled={loading} className="w-full rounded-full">
              {loading ? "Please wait..." : "Update password"}
            </Button>
          </div>
        ) : (
          <Tabs value={mode} onValueChange={(value) => setMode(value as "signin" | "signup")}>
            <TabsList className="grid w-full grid-cols-2 rounded-full">
              <TabsTrigger value="signin" className="rounded-full">
                Sign In
              </TabsTrigger>
              <TabsTrigger value="signup" className="rounded-full">
                Sign Up
              </TabsTrigger>
            </TabsList>

            <div className="mt-6 space-y-4">
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Email
                </Label>
                <Input
                  ref={emailRef}
                  className="mt-1.5 h-11"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={200}
                  autoComplete="email"
                  inputMode="email"
                  autoCapitalize="none"
                  spellCheck={false}
                />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Password
                </Label>
                <Input
                  className="mt-1.5 h-11"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  maxLength={100}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                />
              </div>
              <Button
                onClick={() => handle(mode)}
                disabled={loading}
                className="w-full rounded-full"
              >
                {loading ? "Please wait..." : mode === "signin" ? "Sign In" : "Create account"}
              </Button>
              {mode === "signin" && (
                <button
                  type="button"
                  onClick={sendResetEmail}
                  disabled={loading}
                  className="w-full text-center text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
                >
                  Forgot password?
                </button>
              )}
            </div>
          </Tabs>
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary">
            ← Back to site
          </Link>
        </p>
      </div>
    </section>
  );
}
