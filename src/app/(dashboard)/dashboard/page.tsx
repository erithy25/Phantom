"use client";

import {
  Users,
  DollarSign,
  CreditCard,
  Activity,
  ArrowUpRight,
  TrendingUp,
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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const revenueData = [
  { month: "Jan", revenue: 4200 },
  { month: "Feb", revenue: 4800 },
  { month: "Mar", revenue: 5100 },
  { month: "Apr", revenue: 4900 },
  { month: "May", revenue: 6200 },
  { month: "Jun", revenue: 7100 },
  { month: "Jul", revenue: 7800 },
  { month: "Aug", revenue: 8200 },
  { month: "Sep", revenue: 8900 },
  { month: "Oct", revenue: 9400 },
  { month: "Nov", revenue: 10200 },
  { month: "Dec", revenue: 11800 },
];

const userGrowthData = [
  { month: "Jan", users: 120 },
  { month: "Feb", users: 180 },
  { month: "Mar", users: 240 },
  { month: "Apr", users: 310 },
  { month: "May", users: 420 },
  { month: "Jun", users: 510 },
  { month: "Jul", users: 620 },
  { month: "Aug", users: 750 },
  { month: "Sep", users: 890 },
  { month: "Oct", users: 1050 },
  { month: "Nov", users: 1180 },
  { month: "Dec", users: 1340 },
];

const statsCards = [
  {
    title: "Total Users",
    value: "2,847",
    change: "+12.5%",
    period: "from last month",
    icon: Users,
    iconBg: "bg-purple-500/20",
    iconColor: "text-purple-400",
  },
  {
    title: "Revenue",
    value: "$45,231",
    change: "+20.1%",
    period: "from last month",
    icon: DollarSign,
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-400",
  },
  {
    title: "Subscriptions",
    value: "1,234",
    change: "+8.2%",
    period: "from last month",
    icon: CreditCard,
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-400",
  },
  {
    title: "Active Now",
    value: "573",
    change: "+4.3%",
    period: "from last hour",
    icon: Activity,
    iconBg: "bg-orange-500/20",
    iconColor: "text-orange-400",
  },
];

const recentActivity = [
  {
    id: 1,
    user: "Sarah Chen",
    initials: "SC",
    action: "New user registered",
    timestamp: "2 minutes ago",
  },
  {
    id: 2,
    user: "Alex Rivera",
    initials: "AR",
    action: "Subscription upgraded to Pro",
    timestamp: "15 minutes ago",
  },
  {
    id: 3,
    user: "James Wilson",
    initials: "JW",
    action: "Payment received - $49.99",
    timestamp: "1 hour ago",
  },
  {
    id: 4,
    user: "Emily Park",
    initials: "EP",
    action: "Support ticket resolved",
    timestamp: "2 hours ago",
  },
  {
    id: 5,
    user: "Michael Lee",
    initials: "ML",
    action: "New project created",
    timestamp: "3 hours ago",
  },
  {
    id: 6,
    user: "Olivia Brown",
    initials: "OB",
    action: "Subscription cancelled",
    timestamp: "5 hours ago",
  },
  {
    id: 7,
    user: "David Kim",
    initials: "DK",
    action: "Invoice downloaded",
    timestamp: "6 hours ago",
  },
];

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
          {typeof payload[0].value === "number" && payload[0].value > 1000
            ? `$${payload[0].value.toLocaleString()}`
            : payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here&apos;s an overview of your account.
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
                <Badge
                  variant="secondary"
                  className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-0 px-1.5 py-0 text-xs font-medium"
                >
                  <ArrowUpRight className="h-3 w-3 mr-0.5" />
                  {stat.change}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {stat.period}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue Overview Chart */}
        <Card className="glass border-border/40">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Revenue Overview</CardTitle>
                <CardDescription>Monthly revenue for this year</CardDescription>
              </div>
              <div className="flex items-center gap-1 text-emerald-400">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">+24.5%</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
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
                    tickFormatter={(value) => `$${value / 1000}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#a855f7"
                    strokeWidth={2.5}
                    dot={{ fill: "#a855f7", r: 4, strokeWidth: 0 }}
                    activeDot={{
                      r: 6,
                      fill: "#a855f7",
                      stroke: "#a855f7",
                      strokeWidth: 2,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

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
              <div className="flex items-center gap-1 text-emerald-400">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">+18.2%</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userGrowthData}>
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
            </div>
          </CardContent>
        </Card>
      </div>

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
            {recentActivity.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-accent/50"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src="" alt={item.user} />
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
                  {item.timestamp}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
