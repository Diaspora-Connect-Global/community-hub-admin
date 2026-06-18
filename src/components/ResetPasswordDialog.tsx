import { useEffect, useState } from "react";
import { Loader2, Mail, Eye, EyeOff, KeyRound } from "lucide-react";
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
  passwordMutationError,
} from "@/services/graphql/authentication/passwordMutations";

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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState(initialEmail);
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [resetting, setResetting] = useState(false);

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
      setSending(false);
      setResetting(false);
    }
  }, [open, initialEmail]);

  const sendCode = async () => {
    setError(null);
    if (!EMAIL_RE.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setSending(true);
    try {
      const result = await forgotPasswordMutation(email);
      const failure = passwordMutationError(result);
      if (failure) throw new Error(failure);
      toast({
        title: "Check your email",
        description: `If an account exists for ${email}, a reset code has been sent.`,
      });
      setStep("reset");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not send reset code.";
      setError(message);
      toast({ title: "Request failed", description: message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const submitReset = async () => {
    setError(null);
    if (!resetCode.trim()) {
      setError("Enter the reset code from your email.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }
    setResetting(true);
    try {
      const result = await resetPasswordMutation({
        email,
        resetCode: resetCode.trim(),
        newPassword,
      });
      const failure = passwordMutationError(result);
      if (failure) throw new Error(failure);
      toast({
        title: "Password reset",
        description: "Your password has been updated. You can now sign in with it.",
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not reset password.";
      setError(message);
      toast({ title: "Reset failed", description: message, variant: "destructive" });
    } finally {
      setResetting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>
            {step === "request"
              ? "Enter your email and we'll send you a reset code."
              : `Enter the code we sent to ${email} and choose a new password.`}
          </DialogDescription>
        </DialogHeader>

        {step === "request" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendCode();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="Enter your admin email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={sending || lockEmail}
                  readOnly={lockEmail}
                  autoFocus={!lockEmail}
                />
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={sending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={sending}>
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending…
                  </>
                ) : (
                  "Send reset code"
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
          >
            <div className="space-y-2">
              <Label htmlFor="reset-code">Reset code</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reset-code"
                  inputMode="numeric"
                  placeholder="Enter the code from your email"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  className="pl-10"
                  disabled={resetting}
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reset-new-password">New password</Label>
              <div className="relative">
                <Input
                  id="reset-new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                  autoComplete="new-password"
                  disabled={resetting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Min 8 characters, include uppercase, lowercase, number, and symbol.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reset-confirm-password">Confirm new password</Label>
              <Input
                id="reset-confirm-password"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                disabled={resetting}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => void sendCode()}
                disabled={sending || resetting}
                className="text-sm text-primary hover:underline disabled:opacity-50"
              >
                {sending ? "Resending…" : "Resend code"}
              </button>
              {!lockEmail && (
                <button
                  type="button"
                  onClick={() => {
                    setStep("request");
                    setError(null);
                  }}
                  disabled={resetting}
                  className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  Use a different email
                </button>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={resetting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={resetting}>
                {resetting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Resetting…
                  </>
                ) : (
                  "Reset password"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
