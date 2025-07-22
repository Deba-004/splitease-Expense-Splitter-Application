"use client";

import { api } from "@/convex/_generated/api";
import { useConvexMutation, useConvexQuery } from "@/hooks/useConvexQuery";
import { Card, CardContent } from "./ui/card";
import { getCategoryById, getCategoryIcon } from "@/lib/expense-categories";
import { format } from "date-fns";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";

function ExpenseList({
    expenses,
    showOtherPerson=true,
    isGroupExpense=false,
    otherPersonId=null,
    userLookUpMap={},
}) {
  const { data: currentUser } = useConvexQuery(api.users.getCurrentUser);
  const deleteExpense = useConvexMutation(api.expenses.deleteExpense);

  if(!expenses || expenses.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No expenses found
        </CardContent>
      </Card>
    );
  }

  const getUserDetails = (userId) => {
    return {
      name:
        userId == currentUser?._id
          ? "You"
          : userLookUpMap[userId]?.name || "Unknown User",
      imageURL: userLookUpMap[userId]?.imageURL || null,
      id: userId
    }
  };

  const canDeleteExpense = (expense) => {
    if(!currentUser) return false;
    const isCreatedByCurrentUser = expense.createdBy === currentUser?._id;
    const isPaidByCurrentUser = expense.paidByUserId === currentUser?._id;
    return isCreatedByCurrentUser || isPaidByCurrentUser;
  };

  const handleDeleteExpense = async (expense) => {
    const confirmed = window.confirm("Are you sure you want to delete this expense?");
    if(!confirmed) return;

    try {
      await deleteExpense.mutate({ expenseId: expense._id });
      toast.success("Expense deleted successfully");
    } catch (error) {
      toast.error("Failed to delete expense: " + error.message);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {
        expenses.map((expense) => {
          const payer = getUserDetails(expense.paidByUserId);
          const isCurrentUserPayer = expense.paidByUserId === currentUser?._id;
          const category = getCategoryById(expense.category);
          const CategoryIcon = getCategoryIcon(category.id);
          const showDeleteButton = canDeleteExpense(expense);

          return (
            <Card key={expense._id} className="hover:bg-muted/30 transition-colors">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <CategoryIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{expense.description}</h3>
                      <div className="flex items-center text-sm text-muted-foreground gap-2">
                        <span>
                          {format(new Date(expense.date), "MMM dd, yyyy")}
                        </span>
                        {showOtherPerson && (
                          <>
                            <span>•</span>
                            <span>{isCurrentUserPayer ? "You" : payer.name} paid</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="font-medium">
                        ${expense.amount.toFixed(2)}
                      </div>
                      {isGroupExpense ? (
                        <Badge variant="outline" className="mt-1">
                          Group Expense
                        </Badge>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          {isCurrentUserPayer ? (
                            <span className="text-green-500">You paid</span>
                          ) : (
                            <span className="text-red-500">{payer.name} paid</span>
                          )}
                        </div>
                      )}
                    </div>
                    {showDeleteButton && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-red-500 hover:text-red-700 hover:bg-red-100 cursor-pointer"
                        onClick={() => handleDeleteExpense(expense)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete Expense</span>
                      </Button>
                    )}
                  </div>
                </div>

                <div className="mt-3 text-sm">
                  <div className="flex flex-wrap gap-2">
                    {expense.splits.map((split, idx) => {
                      const splitUser = getUserDetails(split.userId, expense);
                      const isCurrentUser = split.userId === currentUser?._id;
                      const shouldShow =
                        showOtherPerson ||
                        (!showOtherPerson &&
                          (split.userId === currentUser?._id || split.userId === otherPersonId)
                        );
                    
                      if(!shouldShow) return null;

                      return (
                        <Badge
                          key={idx}
                          variant={split.paid ? "outline" : "secondary"}
                          className="flex items-center gap-1"
                        >
                          <Avatar>
                            <AvatarImage src={splitUser?.imageURL} />
                            <AvatarFallback>{splitUser?.name.charAt(0) || "U"}</AvatarFallback>
                          </Avatar>
                          <span>{isCurrentUser ? "You" : splitUser?.name}: ${split.amount.toFixed(2)}</span>
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })
      }
    </div>
  );
}

export default ExpenseList;