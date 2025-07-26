"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import ExpenseForm from "./_components/ExpenseForm";

function NewExpensePage() {
  const router = useRouter();
    
  return (
    <div className="container max-w-3xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-5xl gradient-heading">Add a new expense</h1>
        <p className="text-muted-foreground mt-1">Record a new expense to split with other members</p>
      </div>

      <Card>
        <CardContent>
          <Tabs className="pb-3" defaultValue="individual">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="individual" className="cursor-pointer">Individual</TabsTrigger>
              <TabsTrigger value="group" className="cursor-pointer">Group</TabsTrigger>
            </TabsList>
            <TabsContent value="individual" className="mt-0">
              <ExpenseForm
                type="individual"
                onSuccess={(id) => router.push(`/person/${id}`)}
              />
            </TabsContent>
            <TabsContent value="group" className="mt-0">
              <ExpenseForm
                type="group"
                onSuccess={(id) => router.push(`/groups/${id}`)}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default NewExpensePage;