import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// ── Inner form (must be inside <Elements>) ─────────────────────────────────

interface PaymentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  onProcessingChange?: (processing: boolean) => void;
}

function PaymentForm({ onSuccess, onCancel, onProcessingChange }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const setProcessing = (value: boolean) => {
    setIsProcessing(value);
    onProcessingChange?.(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setErrorMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      setErrorMessage(error.message ?? "Payment failed. Please try again.");
      setProcessing(false);
      return;
    }

    // "processing" = async payment methods (ACH, SEPA) — treat as success
    if (paymentIntent?.status === "succeeded" || paymentIntent?.status === "processing") {
      onSuccess();
    } else if (paymentIntent?.status === "requires_action") {
      setErrorMessage("Your bank requires additional verification. Please complete it and try again.");
      setProcessing(false);
    } else {
      setErrorMessage("Payment was not completed. Please try again.");
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-5">
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />

      {errorMessage && (
        <p className="text-sm text-destructive rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2">
          {errorMessage}
        </p>
      )}

      <DialogFooter className="gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isProcessing}>
          Cancel
        </Button>
        <Button type="submit" disabled={!stripe || !elements || isProcessing}>
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Processing…
            </>
          ) : (
            "Pay"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ── Public component ────────────────────────────────────────────────────────

interface PaymentModalProps {
  open: boolean;
  clientSecret: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PaymentModal({
  open,
  clientSecret,
  onSuccess,
  onCancel,
}: PaymentModalProps) {
  const [stripePromise] = useState(() => {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!key) throw new Error("VITE_STRIPE_PUBLISHABLE_KEY is not set");
    return loadStripe(key);
  });

  const [isProcessing, setIsProcessing] = useState(false);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen && !isProcessing) onCancel(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
          <DialogDescription>Complete your membership payment securely via Stripe.</DialogDescription>
        </DialogHeader>

        {clientSecret ? (
          <Elements
            key={clientSecret}
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: "stripe",
                variables: {
                  colorPrimary: "hsl(var(--primary))",
                  borderRadius: "8px",
                },
              },
            }}
          >
            <PaymentForm
              onSuccess={onSuccess}
              onCancel={onCancel}
              onProcessingChange={setIsProcessing}
            />
          </Elements>
        ) : (
          <div className="flex items-center justify-center py-8">
            <Loader2 aria-hidden="true" className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="sr-only">Loading payment form…</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
