"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ProGateProps {
  children: React.ReactNode;
}

export function ProGate({ children }: ProGateProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "pro" | "free">("loading");

  useEffect(() => {
    async function checkPlan() {
      try {
        const res = await fetch("/api/subscription");
        if (res.ok) {
          const data = await res.json();
          if (data.plan === "PRO" || data.plan === "GHOST") {
            setStatus("pro");
          } else {
            setStatus("free");
          }
        } else {
          setStatus("free");
        }
      } catch {
        setStatus("free");
      }
    }

    checkPlan();
  }, []);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-phantom-border border-t-phantom-text animate-spin" />
      </div>
    );
  }

  if (status === "free") {
    router.replace("/upgrade");
    return null;
  }

  return <>{children}</>;
}
