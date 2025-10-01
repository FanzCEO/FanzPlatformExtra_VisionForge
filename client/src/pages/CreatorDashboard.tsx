import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import NavigationHeader from "@/components/NavigationHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, Eye, TrendingUp } from "lucide-react";

export default function CreatorDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

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

  useEffect(() => {
    if (!authLoading && user && !user.creator) {
      toast({
        title: "Creator Profile Required",
        description: "You need a creator profile to access the dashboard",
        variant: "destructive",
      });
    }
  }, [authLoading, user, toast]);

  const { data: analytics } = useQuery({
    queryKey: [`/api/analytics/${user?.creator?.id}`],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/${user?.creator?.id}?days=30`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
    enabled: !!user?.creator?.id,
    retry: false,
  });

  const { data: subscriptions } = useQuery({
    queryKey: [`/api/subscriptions/creator/${user?.creator?.id}`],
    enabled: !!user?.creator?.id,
    retry: false,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user?.creator) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <div className="pt-16 flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Creator Profile Required</h1>
            <p className="text-muted-foreground mb-6">
              You need to create a creator profile to access the dashboard
            </p>
          </div>
        </div>
      </div>
    );
  }

  const totalEarnings = subscriptions?.reduce((sum: number, sub: any) => {
    return sum + parseFloat(sub.tier?.priceMonthly || 0);
  }, 0) || 0;

  const totalViews = analytics?.reduce((sum: number, day: any) => sum + (day.views || 0), 0) || 0;
  const avgEngagement = analytics?.reduce((sum: number, day: any) => {
    return sum + parseFloat(day.engagementRate || 0);
  }, 0) / (analytics?.length || 1) || 0;

  return (
    <div className="min-h-screen bg-background pb-20 xl:pb-0">
      <NavigationHeader />
      
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Creator Dashboard</h1>
            <p className="text-muted-foreground">
              Track your performance and manage your content
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalEarnings.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
                <Users className="h-4 w-4 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{user.creator.followerCount}</div>
                <p className="text-xs text-muted-foreground">Active subscriptions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-chart-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgEngagement.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">Average engagement</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-between gap-2">
                  {analytics?.slice(0, 7).map((day: any, i: number) => (
                    <div 
                      key={i}
                      className="flex-1 bg-primary/20 rounded-t-lg transition-all hover:bg-primary/40"
                      style={{ height: `${((day.revenue || 0) / 100) * 100}%` }}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-4 text-xs text-muted-foreground">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                    <span key={day}>{day}</span>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Posts</span>
                    <span className="font-bold">{user.creator.postCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Avg Views per Post</span>
                    <span className="font-bold">
                      {user.creator.postCount > 0 
                        ? Math.floor(totalViews / user.creator.postCount)
                        : 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Subscriber Growth</span>
                    <span className="font-bold text-green-500">+8.2%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subscriptions?.slice(0, 5).map((sub: any, i: number) => (
                  <div key={i} className="flex items-start gap-4 pb-4 border-b border-border last:border-0">
                    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">New Subscriber</p>
                      <p className="text-sm text-muted-foreground">
                        Subscribed to {sub.tier?.name || 'Premium'} tier
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(sub.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <p className="font-bold text-primary">
                      +${sub.tier?.priceMonthly || 0}
                    </p>
                  </div>
                ))}
                {(!subscriptions || subscriptions.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">
                    No recent activity
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
