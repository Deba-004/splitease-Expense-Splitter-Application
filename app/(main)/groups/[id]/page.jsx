"use client";

import ExpenseList from "@/components/ExpenseList";
import GroupBalances from "@/components/GroupBalances";
import GroupMembers from "@/components/GroupMembers";
import SettlementList from "@/components/SettleMentList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/useConvexQuery";
import { ArrowLeft, ArrowLeftRight, PlusCircle, Users } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { BarLoader } from "react-spinners";

function GroupsPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("expenses");

  const { data, isLoading } = useConvexQuery(api.groups.getGroupsExpenses, { groupId: params.id });

  if(isLoading) {
    return (
      <div className="container mx-auto py-12">
        <BarLoader width={"100%"} color="#36d7b7" />
      </div>
    );
  }

  const group = data?.group;
  const members = data?.members;
  const expenses = data?.expenses;
  const settlements = data?.settlements;
  const balances = data?.balances;
  const userLookUpMap = data?.userLookUpMap;

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="outline"
          className="mb-4 cursor-pointer"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-6 h-6" />
          Back
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-4 rounded-md">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl gradient-heading">{group?.name}</h1>
              <p className="text-muted-foreground">{group?.description}</p>
              <p className="text-sm text-muted-foreground mt-1">{members?.length} members</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/settlements/group/${params.id}`}>
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                Settle Up
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/expenses/new`}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Expense
              </Link>
            </Button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Group Details</CardTitle>
            </CardHeader>
            <CardContent>
              <GroupBalances balances={balances} />
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Members</CardTitle>
            </CardHeader>
            <CardContent>
              <GroupMembers members={members} />
            </CardContent>
          </Card>
        </div>
      </div>
      <Tabs
        defaultValue="expenses"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="expenses" className="cursor-pointer">
            Expenses ({expenses.length})
          </TabsTrigger>
          <TabsTrigger value="settlements" className="cursor-pointer">
            Settlements ({settlements.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="expenses" className="space-y-4">
          <ExpenseList
            expenses={expenses}
            showOtherPerson={true}
            isGroupExpense={true}
            userLookUpMap={userLookUpMap}
          />
        </TabsContent>
        <TabsContent value="settlements" className="space-y-4">
          <SettlementList
            settlements={settlements}
            isGroupExpense={true}
            userLookUpMap={userLookUpMap}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default GroupsPage;