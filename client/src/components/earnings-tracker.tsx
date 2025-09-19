import { useMemo } from "react";
import { DollarSign, TrendingUp, Calendar, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Gig } from "@shared/schema";

interface EarningsTrackerProps {
  gigs: Gig[];
  isLoading: boolean;
}

interface EarningsPeriod {
  period: string;
  earnings: number;
  gigCount: number;
  averagePerGig: number;
}

export function EarningsTracker({ gigs, isLoading }: EarningsTrackerProps) {
  const earnings = useMemo(() => {
    if (!gigs || gigs.length === 0) {
      return {
        totalEarnings: 0,
        totalGigs: 0,
        averagePerGig: 0,
        monthlyEarnings: [],
        yearlyEarnings: [],
        currentMonthEarnings: 0,
        currentYearEarnings: 0,
      };
    }

    // Calculate total earnings
    const totalEarnings = gigs
      .filter(gig => gig.compensation)
      .reduce((sum, gig) => sum + parseFloat(gig.compensation || "0"), 0);

    const paidGigs = gigs.filter(gig => gig.compensation && parseFloat(gig.compensation) > 0);
    const totalGigs = paidGigs.length;
    const averagePerGig = totalGigs > 0 ? totalEarnings / totalGigs : 0;

    // Group by month
    const monthlyMap = new Map<string, { earnings: number; count: number }>();
    // Group by year
    const yearlyMap = new Map<string, { earnings: number; count: number }>();

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const currentYear = now.getFullYear().toString();

    paidGigs.forEach(gig => {
      const gigDate = new Date(gig.date);
      const monthKey = `${gigDate.getFullYear()}-${String(gigDate.getMonth() + 1).padStart(2, "0")}`;
      const yearKey = gigDate.getFullYear().toString();
      const gigEarnings = parseFloat(gig.compensation || "0");

      // Monthly grouping
      const monthData = monthlyMap.get(monthKey) || { earnings: 0, count: 0 };
      monthData.earnings += gigEarnings;
      monthData.count += 1;
      monthlyMap.set(monthKey, monthData);

      // Yearly grouping
      const yearData = yearlyMap.get(yearKey) || { earnings: 0, count: 0 };
      yearData.earnings += gigEarnings;
      yearData.count += 1;
      yearlyMap.set(yearKey, yearData);
    });

    // Convert to arrays and sort by date (most recent first)
    const monthlyEarnings: EarningsPeriod[] = Array.from(monthlyMap.entries())
      .map(([period, data]) => ({
        period,
        earnings: data.earnings,
        gigCount: data.count,
        averagePerGig: data.earnings / data.count,
      }))
      .sort((a, b) => b.period.localeCompare(a.period))
      .slice(0, 12); // Last 12 months

    const yearlyEarnings: EarningsPeriod[] = Array.from(yearlyMap.entries())
      .map(([period, data]) => ({
        period,
        earnings: data.earnings,
        gigCount: data.count,
        averagePerGig: data.earnings / data.count,
      }))
      .sort((a, b) => b.period.localeCompare(a.period));

    const currentMonthEarnings = monthlyMap.get(currentMonth)?.earnings || 0;
    const currentYearEarnings = yearlyMap.get(currentYear)?.earnings || 0;

    return {
      totalEarnings,
      totalGigs,
      averagePerGig,
      monthlyEarnings,
      yearlyEarnings,
      currentMonthEarnings,
      currentYearEarnings,
    };
  }, [gigs]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatPeriod = (period: string, type: "month" | "year") => {
    if (type === "year") return period;

    const [year, month] = period.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short" });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-32 mb-6"></div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="h-24 bg-muted rounded"></div>
            <div className="h-24 bg-muted rounded"></div>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded w-24"></div>
            <div className="h-16 bg-muted rounded"></div>
            <div className="h-16 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (earnings.totalGigs === 0) {
    return (
      <div className="text-center py-12" data-testid="earnings-empty">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <DollarSign className="text-muted-foreground text-2xl" />
        </div>
        <h3 className="text-lg font-medium mb-2">No earnings yet</h3>
        <p className="text-muted-foreground mb-4">
          Add gigs with compensation amounts to track your earnings
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="earnings-tracker">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <div className="text-sm text-muted-foreground">Total Earned</div>
            </div>
            <div className="text-2xl font-bold" data-testid="total-earnings">
              {formatCurrency(earnings.totalEarnings)}
            </div>
            <div className="text-xs text-muted-foreground">From {earnings.totalGigs} gigs</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <div className="text-sm text-muted-foreground">Avg Per Gig</div>
            </div>
            <div className="text-2xl font-bold" data-testid="average-earnings">
              {formatCurrency(earnings.averagePerGig)}
            </div>
            <div className="text-xs text-muted-foreground">Average rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Current Period */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              <div className="text-sm text-muted-foreground">This Month</div>
            </div>
            <div className="text-xl font-semibold" data-testid="current-month-earnings">
              {formatCurrency(earnings.currentMonthEarnings)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-orange-600" />
              <div className="text-sm text-muted-foreground">This Year</div>
            </div>
            <div className="text-xl font-semibold" data-testid="current-year-earnings">
              {formatCurrency(earnings.currentYearEarnings)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Breakdown */}
      {earnings.monthlyEarnings.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Monthly Earnings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {earnings.monthlyEarnings.map(month => (
              <div
                key={month.period}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
                data-testid={`month-${month.period}`}
              >
                <div>
                  <div className="font-medium">{formatPeriod(month.period, "month")}</div>
                  <div className="text-sm text-muted-foreground">
                    {month.gigCount} gig{month.gigCount !== 1 ? "s" : ""}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatCurrency(month.earnings)}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(month.averagePerGig)} avg
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Yearly Breakdown */}
      {earnings.yearlyEarnings.length > 1 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Yearly Earnings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {earnings.yearlyEarnings.map(year => (
              <div
                key={year.period}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
                data-testid={`year-${year.period}`}
              >
                <div>
                  <div className="font-medium">{year.period}</div>
                  <div className="text-sm text-muted-foreground">
                    {year.gigCount} gig{year.gigCount !== 1 ? "s" : ""}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatCurrency(year.earnings)}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(year.averagePerGig)} avg
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
