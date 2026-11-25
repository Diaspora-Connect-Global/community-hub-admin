import { useEffect, useState } from "react";
import { Loader2, Mail, Eye, EyeOff, KeyRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  forgotPasswordMutation,
  resetPasswordMutation,
} from "@/services/graphql/authentication/passwordMutations";
import {
  PASSWORD_MAX_LENGTH,
  requestCode,
  submitNewPassword,
  type SetPasswordApi,
  type SetPasswordErrorKey,
} from "@/lib/setPassword";

const api: SetPasswordApi = {
  forgotPassword: forgotPasswordMutation,
  resetPassword: resetPasswordMutation,
};

interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-fill the email (e.g. the signed-in admin's address). */
  initialEmail?: string;
  /** When true the email field is read-only — used from Profile where the email is known. */
  lockEmail?: boolean;
  /** Called after a successful password reset (dialog closes itself first). */
  onSuccess?: () => void;
}

type Step = "request" | "reset";

/**
 * Self-service password reset by email — a two-step flow over the gateway's
 * forgotPassword + resetPassword mutations:
 *   1. "request": send a reset code to the email.
 *   2. "reset":   enter the emailed code + a new password to complete the reset.
 *
 * The same component backs the Login "Forgot password?" entry point and the
 * Profile → Security "Reset via email" action (pass initialEmail + lockEmail there).
 */
export function ResetPasswordDialog({
  open,
  onOpenChange,
  initialEmail = "",
  lockEmail = false,
  onSuccess,
}: ResetPasswordDialogProps) {
  const { toast } = useToast();
  const { t } = useTranslation();

  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState(initialEmail);
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<SetPasswordErrorKey | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);

  // Reset all internal state whenever the dialog is (re)opened so a previous
  // attempt never leaks into a new one.
  useEffect(() => {
    if (open) {
      setStep("request");
      setEmail(initialEmail);
      setResetCode("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setError(null);
      setCodeSent(false);
      setBusy(false);
    }
  }, [open, initialEmail]);

  // The same request/validation logic as the public /set-password page, so the password rule
  // (12-128 chars, upper, lower, digit, symbol) exists in exactly one place.
  const sendCode = async () => {
    setError(null);
    setBusy(true);
    const outcome = await requestCode(email, api);
    setBusy(false);
    if ("error" in outcome) {
      setError(outcome.error);
      return;
    }
    setCodeSent(true); // generic wording: never confirms whether an account exists
    setStep("reset");
  };

  const submitReset = async () => {
    setError(null);
    setBusy(true);
    const outcome = await submitNewPassword(
      { email, code: resetCode, password: newPassword, confirm: confirmPassword },
      api,
    );
    setBusy(false);
    if ("error" in outcome) {
      setError(outcome.error);
      return;
    }
    toast({ title: t("setPassword.successTitle"), description: t("setPassword.successBody") });
    onOpenChange(false);
    onSuccess?.();
  };

  const errorId = "reset-dialog-error";
  const errorEl = error ? (
    <p id={errorId} role="alert" className="text-sm text-destructive">
      {t(`setPassword.${error}`)}
    </p>
  ) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("resetDialog.title")}</DialogTitle>
          <DialogDescription>
            {step === "request"
              ? t("setPassword.descRequest")
              : t("setPassword.descReset", { email })}
          </DialogDescription>
        </DialogHeader>

        {step === "request" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendCode();
            }}
            className="space-y-4"
            noValidate
          >
            <div className="space-y-2">
              <Label htmlFor="reset-email">{t("setPassword.email")}</Label>
              <div className="relative">
                <Mail aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reset-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={busy || lockEmail}
                  readOnly={lockEmail}
                  aria-invalid={!!error}
                  aria-describedby={error ? errorId : undefined}
                  autoFocus={!lockEmail}
                  required
                />
              </div>
            </div>

            {errorEl}

            <DialogFooter className="gap-2 sm:gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
                {t("resetDialog.cancel")}
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? (
                  <>
                    <Loader2 aria-hidden="true" className="h-4 w-4 mr-2 animate-spin" />
                    {t("setPassword.sending")}
                  </>
                ) : (
                  t("setPassword.sendCode")
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submitReset();
            }}
            className="space-y-4"
            noValidate
          >
            {codeSent && (
              <p role="status" className="text-sm text-muted-foreground">
                {t("setPassword.codeSent")}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="reset-code">{t("setPassword.code")}</Label>
              <div className="relative">
                <KeyRound aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reset-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  className="pl-10"
                  disabled={busy}
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reset-new-password">{t("setPassword.newPassword")}</Label>
              <div className="relative">
                <Input
                  id="reset-new-password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                  autoComplete="new-password"
                  maxLength={PASSWORD_MAX_LENGTH + 1}
                  aria-describedby="reset-rules"
                  disabled={busy}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? t("setPassword.hide") : t("setPassword.show")}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
                </button>
              </div>
              <p id="reset-rules" className="text-xs text-muted-foreground">
                {t("setPassword.rules")}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reset-confirm-password">{t("setPassword.confirmPassword")}</Label>
              <Input
                id="reset-confirm-password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                maxLength={PASSWORD_MAX_LENGTH + 1}
                aria-invalid={error === "errMismatch"}
                aria-describedby={error ? errorId : undefined}
                disabled={busy}
                required
              />
            </div>

            {errorEl}

            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => void sendCode()}
                disabled={busy}
                className="text-sm text-primary hover:underline disabled:opacity-50"
              >
                {t("setPassword.resend")}
              </button>
              {!lockEmail && (
                <button
                  type="button"
                  onClick={() => {
                    setStep("request");
                    setError(null);
                    setCodeSent(false);
                  }}
                  disabled={busy}
                  className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  {t("setPassword.differentEmail")}
                </button>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
                {t("resetDialog.cancel")}
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? (
                  <>
                    <Loader2 aria-hidden="true" className="h-4 w-4 mr-2 animate-spin" />
                    {t("setPassword.submitting")}
                  </>
                ) : (
                  t("setPassword.submit")
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
