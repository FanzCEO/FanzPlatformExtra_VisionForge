import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import NavigationHeader from "@/components/NavigationHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Check, Crown, AlertCircle } from "lucide-react";

const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

function SubscribeForm({ tierId, creatorId }: { tierId: string; creatorId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/profile`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: "You are now subscribed!",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button
        type="submit"
        disabled={!stripe}
        className="w-full bg-gradient-to-r from-primary to-secondary"
      >
        Subscribe Now
      </Button>
    </form>
  );
}

export default function Subscribe() {
  const { creatorId } = useParams();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [authLoading, user, toast]);

  const { data: tiers, isLoading: tiersLoading } = useQuery({
    queryKey: [`/api/subscription-tiers/${creatorId}`],
    enabled: !!creatorId,
    retry: false,
  });

  const { data: creator } = useQuery({
    queryKey: [`/api/creators/${creatorId}`],
    enabled: !!creatorId,
    retry: false,
  });

  const createSubscriptionMutation = useMutation({
    mutationFn: async (tierId: string) => {
      const res = await apiRequest("POST", "/api/create-subscription", {
        tierId,
        creatorId,
      });
      return await res.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create subscription",
        variant: "destructive",
      });
    },
  });

  const handleSelectTier = (tierId: string) => {
    setSelectedTier(tierId);
    createSubscriptionMutation.mutate(tierId);
  };

  if (authLoading || tiersLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!stripePromise) {
    return (
      <div className="min-h-screen bg-background pb-20 xl:pb-0">
        <NavigationHeader />
        <main className="pt-16">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Card className="border-yellow-500/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-6 h-6 text-yellow-500" />
                  Payment Processing Unavailable
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Subscriptions are currently unavailable because payment processing is not configured.
                </p>
                <p className="text-sm text-muted-foreground">
                  The site administrator needs to configure Stripe API keys to enable subscription payments.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 xl:pb-0">
      <NavigationHeader />
      
      <main className="pt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">
              Subscribe to {creator?.displayName || "Creator"}
            </h1>
            <p className="text-muted-foreground text-lg">
              Choose a subscription tier to unlock exclusive content
            </p>
          </div>

          {!clientSecret ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {tiers?.map((tier: any) => (
                <Card 
                  key={tier.id} 
                  className={`relative ${
                    tier.tier === "premium" 
                      ? "border-primary shadow-lg shadow-primary/20" 
                      : ""
                  }`}
                >
                  {tier.tier === "premium" && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-primary to-secondary rounded-full text-sm font-bold">
                      Most Popular
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {tier.tier === "vip" && <Crown className="w-5 h-5 text-accent" />}
                      {tier.name}
                    </CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">${tier.priceMonthly}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {tier.description && (
                      <p className="text-sm text-muted-foreground mb-4">{tier.description}</p>
                    )}
                    
                    <ul className="space-y-3 mb-6">
                      {tier.features?.map((feature: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      )) || (
                        <>
                          <li className="flex items-start gap-2">
                            <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                            <span className="text-sm">Access to exclusive content</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                            <span className="text-sm">Priority support</span>
                          </li>
                        </>
                      )}
                    </ul>

                    <Button
                      onClick={() => handleSelectTier(tier.id)}
                      disabled={createSubscriptionMutation.isPending}
                      className={`w-full ${
                        tier.tier === "premium"
                          ? "bg-gradient-to-r from-primary to-secondary"
                          : ""
                      }`}
                    >
                      {createSubscriptionMutation.isPending && selectedTier === tier.id
                        ? "Processing..."
                        : "Subscribe"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Complete Your Subscription</CardTitle>
              </CardHeader>
              <CardContent>
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <SubscribeForm tierId={selectedTier!} creatorId={creatorId!} />
                </Elements>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
