"use client";

import { useState, useEffect } from "react";
import {
  Users,
  DollarSign,
  CreditCard,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface DashboardStats {
  stats: {
    totalUsers: number;
    mrr: number;
    totalPaidSubs: number;
    newUsersThisMonth: number;
    userGrowthPct: string;
  };
  userGrowthData: { month: string; users: number }[];
  recentActivity: {
    id: string;
    user: string;
    initials: string;
    image: string | null;
    action: string;
    timestamp: string;
  }[];
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return date.toLocaleDateString();
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-lg px-3 py-2 border border-border/40">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground">
          {payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/dashboard/stats");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = data?.stats;
  const growthPositive = stats?.userGrowthPct?.startsWith("+");

  const statsCards = [
    {
      title: "Total Users",
      value: stats?.totalUsers?.toLocaleString() || "0",
      change: stats?.userGrowthPct || "+0%",
      period: "from last month",
      icon: Users,
      iconBg: "bg-purple-500/20",
      iconColor: "text-purple-400",
      positive: growthPositive,
    },
    {
      title: "Monthly Revenue",
      value: `$${(stats?.mrr || 0).toLocaleString()}`,
      change: "",
      period: "MRR",
      icon: DollarSign,
      iconBg: "bg-emerald-500/20",
      iconColor: "text-emerald-400",
      positive: true,
    },
    {
      title: "Paid Subscriptions",
      value: stats?.totalPaidSubs?.toLocaleString() || "0",
      change: "",
      period: "active",
      icon: CreditCard,
      iconBg: "bg-blue-500/20",
      iconColor: "text-blue-400",
      positive: true,
    },
    {
      title: "New This Month",
      value: stats?.newUsersThisMonth?.toLocaleString() || "0",
      change: "",
      period: "registrations",
      icon: Activity,
      iconBg: "bg-orange-500/20",
      iconColor: "text-orange-400",
      positive: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here&apos;s an overview of your platform.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <Card key={stat.title} className="glass border-border/40">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div
                className={`h-9 w-9 rounded-full ${stat.iconBg} flex items-center justify-center`}
              >
                <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-1 mt-1">
                {stat.change && (
                  <Badge
                    variant="secondary"
                    className={`${
                      stat.positive
                        ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                        : "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                    } border-0 px-1.5 py-0 text-xs font-medium`}
                  >
                    {stat.positive ? (
                      <ArrowUpRight className="h-3 w-3 mr-0.5" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 mr-0.5" />
                    )}
                    {stat.change}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {stat.period}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* User Growth Chart */}
      <Card className="glass border-border/40">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">User Growth</CardTitle>
              <CardDescription>
                New user registrations per month
              </CardDescription>
            </div>
            {growthPositive && (
              <div className="flex items-center gap-1 text-emerald-400">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {stats?.userGrowthPct}
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            {data?.userGrowthData && data.userGrowthData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.userGrowthData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    opacity={0.3}
                  />
                  <XAxis
                    dataKey="month"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="users"
                    fill="#a855f7"
                    radius={[4, 4, 0, 0]}
                    opacity={0.85}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No data yet. User registrations will appear here.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Section */}
      <Card className="glass border-border/40">
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <CardDescription>
            Latest events across your platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data?.recentActivity && data.recentActivity.length > 0 ? (
              data.recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-accent/50"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={item.image || ""} alt={item.user} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                      {item.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none">
                      {item.user}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.action}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatTimeAgo(item.timestamp)}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No activity yet. Events will appear here as users interact with
                the platform.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
