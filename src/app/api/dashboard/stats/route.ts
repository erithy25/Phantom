import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalUsers,
      usersThisMonth,
      usersLastMonth,
      subscriptions,
      recentActivity,
      monthlyGrowth,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { createdAt: { gte: startOfMonth } } }),
      db.user.count({
        where: {
          createdAt: { gte: startOfLastMonth, lt: startOfMonth },
        },
      }),
      db.subscription.groupBy({
        by: ["plan"],
        _count: { plan: true },
      }),
      db.activity.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, image: true } },
        },
      }),
      // Get user registrations per month for the last 12 months
      db.$queryRaw<{ month: Date; count: bigint }[]>`
        SELECT DATE_TRUNC('month', "createdAt") as month, COUNT(*)::bigint as count
        FROM "User"
        WHERE "createdAt" >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY month ASC
      `,
    ]);

    const paidSubs = subscriptions.filter((s) => s.plan !== "FREE");
    const totalPaidSubs = paidSubs.reduce((acc, s) => acc + s._count.plan, 0);

    // Calculate MRR from subscriptions
    const proCount =
      subscriptions.find((s) => s.plan === "PRO")?._count.plan || 0;
    const enterpriseCount =
      subscriptions.find((s) => s.plan === "ENTERPRISE")?._count.plan || 0;
    const mrr = proCount * 29 + enterpriseCount * 99;

    const userGrowthPct =
      usersLastMonth > 0
        ? (((usersThisMonth - usersLastMonth) / usersLastMonth) * 100).toFixed(1)
        : usersThisMonth > 0
          ? "100"
          : "0";

    // Format monthly growth for charts
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    const userGrowthData = monthlyGrowth.map((row) => ({
      month: monthNames[new Date(row.month).getMonth()],
      users: Number(row.count),
    }));

    // Format recent activity
    const activityData = recentActivity.map((a) => {
      const userName = a.user?.name || "Unknown User";
      const initials = userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

      return {
        id: a.id,
        user: userName,
        initials,
        image: a.user?.image || null,
        action: a.message,
        timestamp: a.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      stats: {
        totalUsers,
        mrr,
        totalPaidSubs,
        newUsersThisMonth: usersThisMonth,
        userGrowthPct: `${Number(userGrowthPct) >= 0 ? "+" : ""}${userGrowthPct}%`,
      },
      userGrowthData,
      recentActivity: activityData,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard stats" },
      { status: 500 }
    );
  }
}
