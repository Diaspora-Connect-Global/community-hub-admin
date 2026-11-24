import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, KeyRound, Loader2, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { forgotPasswordMutation, resetPasswordMutation } from "@/services/graphql/authentication/passwordMutations";
import {
  PASSWORD_MAX_LENGTH,
  readSetPasswordParams,
  requestCode,
  submitNewPassword,
  type SetPasswordApi,
  type SetPasswordErrorKey,
} from "@/lib/setPassword";

const api: SetPasswordApi = {
  forgotPassword: forgotPasswordMutation,
  resetPassword: resetPasswordMutation,
};

type Step = "request" | "reset";

/**
 * Public page opened from a new administrator's "set your password" email.
 * Step 1 sends a one-time code to the email; step 2 takes the code and the new password.
 * `?email=` / `?code=` only prefill, and are removed from the address bar after being read.
 */
export default function SetPassword() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [initial] = useState(() => readSetPasswordParams(window.location.search));
  const [step, setStep] = useState<Step>(initial.email && initial.code ? "reset" : "request");
  const [email, setEmail] = useState(initial.email);
  const [code, setCode] = useState(initial.code);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<SetPasswordErrorKey | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    // Keep the address, not the prefill, in history so a code never lingers in the URL bar.
    if (window.location.search) window.history.replaceState(null, "", window.location.pathname);
    return () => {
      mounted.current = false;
    };
  }, []);

  const sendCode = async (e?: FormEvent) => {
    e?.preventDefault();
    setError(null);
    setBusy(true);
    const outcome = await requestCode(email, api);
    if (!mounted.current) return;
    setBusy(false);
    if (!outcome.ok) {
      setError(outcome.error);
      return;
    }
    setCodeSent(true);
    setStep("reset");
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const outcome = await submitNewPassword({ email, code, password, confirm }, api);
    if (!mounted.current) return;
    setBusy(false);
    if (!outcome.ok) {
      setError(outcome.error);
      return;
    }
    // Only ever to this console's own sign-in page.
    navigate("/login?passwordSet=1", { replace: true });
  };

  const errorId = "set-password-error";
  const errorText = error ? t(`setPassword.${error}`) : null;

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md space-y-6">
        <Card className="border-border">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl" role="heading" aria-level={1}>
              {t("setPassword.title")}
            </CardTitle>
            <CardDescription>
              {step === "request" ? t("setPassword.descRequest") : t("setPassword.descReset")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "request" ? (
              <form onSubmit={sendCode} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="sp-email">{t("setPassword.email")}</Label>
                  <div className="relative">
                    <Mail aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="sp-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      aria-invalid={!!error}
                      aria-describedby={error ? errorId : undefined}
                      disabled={busy}
                      autoFocus
                      required
                    />
                  </div>
                </div>
                {errorText && (
                  <p id={errorId} role="alert" className="text-sm text-destructive">
                    {errorText}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? (
                    <>
                      <Loader2 aria-hidden="true" className="h-4 w-4 mr-2 animate-spin" />
                      {t("setPassword.sending")}
                    </>
                  ) : (
                    t("setPassword.sendCode")
                  )}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setStep("reset");
                  }}
                  className="text-sm text-primary hover:underline"
                >
                  {t("setPassword.haveCode")}
                </button>
              </form>
            ) : (
              <form onSubmit={submit} className="space-y-4" noValidate>
                {codeSent && (
                  <p role="status" className="text-sm text-muted-foreground">
                    {t("setPassword.codeSent")}
                  </p>
                )}
                <div className="space-y-2">
                  <Label htmlFor="sp-email-2">{t("setPassword.email")}</Label>
                  <div className="relative">
                    <Mail aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="sp-email-2"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      disabled={busy}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sp-code">{t("setPassword.code")}</Label>
                  <div className="relative">
                    <KeyRound aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="sp-code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="pl-10"
                      disabled={busy}
                      autoFocus={!!email}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sp-password">{t("setPassword.newPassword")}</Label>
                  <div className="relative">
                    <Lock aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="sp-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      maxLength={PASSWORD_MAX_LENGTH + 1}
                      aria-describedby="sp-rules"
                      disabled={busy}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? t("setPassword.hide") : t("setPassword.show")}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
                    </button>
                  </div>
                  <p id="sp-rules" className="text-xs text-muted-foreground">
                    {t("setPassword.rules")}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sp-confirm">{t("setPassword.confirmPassword")}</Label>
                  <Input
                    id="sp-confirm"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    maxLength={PASSWORD_MAX_LENGTH + 1}
                    aria-invalid={error === "errMismatch"}
                    aria-describedby={error ? errorId : undefined}
                    disabled={busy}
                    required
                  />
                </div>
                {errorText && (
                  <p id={errorId} role="alert" className="text-sm text-destructive">
                    {errorText}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? (
                    <>
                      <Loader2 aria-hidden="true" className="h-4 w-4 mr-2 animate-spin" />
                      {t("setPassword.submitting")}
                    </>
                  ) : (
                    t("setPassword.submit")
                  )}
                </Button>
                <div className="flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => void sendCode()}
                    disabled={busy}
                    className="text-sm text-primary hover:underline disabled:opacity-50"
                  >
                    {t("setPassword.resend")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setCodeSent(false);
                      setStep("request");
                    }}
                    disabled={busy}
                    className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
                  >
                    {t("setPassword.differentEmail")}
                  </button>
                </div>
              </form>
            )}
            <p className="mt-6 text-center text-sm">
              <Link to="/login" className="text-primary hover:underline">
                {t("setPassword.backToLogin")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
