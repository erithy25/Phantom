"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Check,
  CreditCard,
  Loader2,
  Sparkles,
  Zap,
  Building,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const plans = [
  {
    id: "FREE",
    name: "Free",
    description: "For individuals getting started",
    price: 0,
    icon: Zap,
    features: [
      "Up to 3 projects",
      "Basic analytics",
      "Community support",
      "1GB storage",
    ],
  },
  {
    id: "PRO",
    name: "Pro",
    description: "For professionals and small teams",
    price: 29,
    icon: Sparkles,
    popular: true,
    features: [
      "Unlimited projects",
      "Advanced analytics",
      "Priority support",
      "50GB storage",
      "Custom domains",
      "API access",
    ],
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    description: "For large organizations",
    price: 99,
    icon: Building,
    features: [
      "Everything in Pro",
      "Unlimited storage",
      "Dedicated support",
      "SSO / SAML",
      "Custom integrations",
      "SLA guarantee",
      "Audit logs",
    ],
  },
];

export default function BillingPage() {
  const { data: session } = useSession();
  const [currentPlan] = useState("FREE");
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleUpgrade = async (planId: string) => {
    setIsLoading(planId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(null);
    }
  };

  const handleManageBilling = async () => {
    setIsLoading("portal");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription plan and billing details.
        </p>
      </div>

      {/* Current Plan */}
      <Card className="glass">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Current Plan
              </CardTitle>
              <CardDescription>
                You are currently on the{" "}
                <span className="text-primary font-medium">{currentPlan}</span>{" "}
                plan.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-primary">
              {currentPlan}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Projects Used</p>
              <p className="text-2xl font-bold">2 / 3</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Storage Used</p>
              <p className="text-2xl font-bold">456 MB</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">API Calls</p>
              <p className="text-2xl font-bold">1,234</p>
            </div>
          </div>
        </CardContent>
        {currentPlan !== "FREE" && (
          <CardFooter>
            <Button
              variant="outline"
              onClick={handleManageBilling}
              disabled={isLoading === "portal"}
              className="gap-2"
            >
              {isLoading === "portal" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              Manage Billing
            </Button>
          </CardFooter>
        )}
      </Card>

      <Separator />

      {/* Plans */}
      <div>
        <h2 className="text-xl font-bold mb-4">Available Plans</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`glass relative transition-all duration-300 hover:border-primary/30 ${
                plan.popular ? "border-primary/50" : ""
              } ${currentPlan === plan.id ? "ring-2 ring-primary/30" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                </div>
              )}
              <CardHeader className="text-center">
                <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                  <plan.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="pt-2">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      {feature}
                    </span>
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                {currentPlan === plan.id ? (
                  <Button className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    className="w-full gap-2"
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isLoading === plan.id}
                  >
                    {isLoading === plan.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        {plan.price > 0 ? "Upgrade" : "Downgrade"}
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
