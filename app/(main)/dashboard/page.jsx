"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/convex/_generated/api"
import { useConvexQuery } from "@/hooks/useConvexQuery"
import { ChevronRight, PlusCircle, Users } from "lucide-react";
import Link from "next/link";
import { BarLoader } from "react-spinners";
import ExpenseSummary from "./_components/expense-summary";
import BalanceSummary from "./_components/balance-summary";
import GroupList from "./_components/group-list";

export default function DashboardPage() {
  const { data: balances, isLoading: isLoadingBalance } = useConvexQuery(api.dashboard.getUserBalance);
  const { data: annualExpense, isLoading: isLoadingAnnualExpense } = useConvexQuery(api.dashboard.getAnnualExpense);
  const { data: monthlyExpense, isLoading: isLoadingMonthlyExpense } = useConvexQuery(api.dashboard.getMonthlyExpense);
  const { data: groups, isLoading: isLoadingGroups } = useConvexQuery(api.dashboard.getUserGroups);

  const isLoading = isLoadingBalance || isLoadingAnnualExpense || isLoadingMonthlyExpense || isLoadingGroups;

  if(isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="w-full py-12 flex justify-center">
          <BarLoader width={"100%"} color="#36d7b7" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col justify-between sm:flex-row sm:items-center gap-4">
        <h1 className="text-5xl gradient-heading">Dashboard</h1>
        <Button asChild>
          <Link href="/expenses/new">
            <PlusCircle />
            Add Expense
          </Link>
        </Button>
      </div>
      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {balances?.totalBalance > 0 ? (
                <span className="text-green-500">+${balances?.totalBalance.toFixed(2)}</span>
              ) : balances?.totalBalance < 0 ? (
                <span className="text-red-600">-${Math.abs(balances?.totalBalance).toFixed(2)}</span>
              ) : (
                <span>$0.00</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {balances?.totalBalance > 0
                ? "You are owed this amount"
                : balances?.totalBalance < 0
                ? "You owe this amount"
                : "You have no outstanding balance"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">You are owed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              ${balances?.youAreOwed.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From {balances?.oweDetails?.youAreOwedBy?.length || 0} users
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">You owe</CardTitle>
          </CardHeader>
          <CardContent>
            {balances?.oweDetails?.youOwe?.length > 0 ? (
              <>
                <div className="text-2xl font-bold text-red-600">
                  ${balances?.youOwe.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  To {balances?.oweDetails?.youOwe?.length || 0} users
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">$0.00</div>
                <p className="text-xs text-muted-foreground mt-1">
                  You don't owe anyone
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <ExpenseSummary
            annualExpense={annualExpense}
            monthlyExpense={monthlyExpense}
          />
        </div>
        {/* Right Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Balance Details</CardTitle>
              <Button variant="link" asChild className="p-0">
                <Link href="/contacts">
                  View All
                  <ChevronRight className="ml-1 w-4 h-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <BalanceSummary balances={balances} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Your Groups</CardTitle>
              <Button variant="link" asChild className="p-0">
                <Link href="/contacts">
                  View All
                  <ChevronRight className="ml-1 w-4 h-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <GroupList groups={groups} />
            </CardContent>
            <CardFooter>
              <Button variant="outline" asChild className="w-full">
                <Link href="/contacts?createGroup=true">
                  <Users className="mr-2 h-4 w-4" />
                  Create New Group
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}