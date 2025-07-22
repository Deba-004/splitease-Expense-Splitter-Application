"use client";

import ExpenseList from "@/components/ExpenseList";
import SettlementList from "@/components/SettleMentList";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/useConvexQuery";
import { AvatarImage } from "@radix-ui/react-avatar";
import { ArrowLeft, ArrowLeftRight, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { BarLoader } from "react-spinners";

function PersonPage() {
  const [activeTab, setActiveTab] = useState("expenses");
  const params = useParams();
  const router = useRouter();
  const { data, isLoading } = useConvexQuery(api.expenses.getExpensebetweenUsers, { userId: params.id });

  if(isLoading) {
    return (
      <div className="container mx-auto py-12">
        <BarLoader width={"100%"} color="#36d7b7" />
      </div>
    );
  }

  const otherUser = data?.otherUser;
  const expenses = data?.expenses || [];
  const settlements = data?.settlements || [];
  const balance = data?.balance || 0;

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="outline"
          className="mb-4 cursor-pointer"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft />
          Back
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-16 w-16">
              <AvatarImage src={otherUser?.imageURL} />
              <AvatarFallback>
                {otherUser?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-4xl gradient-heading">{otherUser?.name}</h1>
              <p className="text-muted-foreground">{otherUser?.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild className="cursor-pointer">
              <Link href={`/settlements/user/${params.id}`}>
                <ArrowLeftRight />
                Settle Up
              </Link>
            </Button>
            <Button asChild className="cursor-pointer">
              <Link href={`/expenses/new`}>
                <PlusCircle className="mr-1 h-4 w-4" />
                Add Expense
              </Link>
            </Button>
          </div>
        </div>
      </div>
      {/* Balance Details */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              {balance === 0 ? (
                <p>You are all settled up!</p>
              ) : balance > 0 ? (
                <p>
                  <span className="font-medium">{otherUser?.name}</span> owes you
                </p>
              ) : (
                <p>
                  You owe <span className="font-medium">{otherUser?.name}</span>
                </p>
              )}
            </div>
            <div className={`text-2xl font-bold ${balance > 0 ? "text-green-500" : balance < 0 ? "text-red-500" : ""}`}>
              ${Math.abs(balance).toFixed(2)}
            </div>
          </div>
        </CardContent>
      </Card>

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
            showOtherPerson={false}
            otherPersonId={params.id}
            userLookUpMap={{ [otherUser.id]: otherUser}}
          />
        </TabsContent>
        <TabsContent value="settlements" className="space-y-4">
          <SettlementList
            settlements={settlements}
            userLookUpMap={{ [otherUser.id]: otherUser}}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default PersonPage;