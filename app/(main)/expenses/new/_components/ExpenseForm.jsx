"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { api } from "@/convex/_generated/api";
import { useConvexMutation, useConvexQuery } from "@/hooks/useConvexQuery";
import { getAllCategories } from "@/lib/expense-categories";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import CategorySelector from "./CategorySelector";
import GroupSelector from "./GroupSelector";
import ParticipantSelector from "./ParticipantSelector";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabsContent } from "@radix-ui/react-tabs";
import SplitSelector from "./SplitSelector";
import { toast } from "sonner";

const expenseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Amount must be a positive number"
    }),
  category: z.string().optional(),
  date: z.date(),
  paidByUserId: z.string().min(1, "Payer is required"),
  splitType: z.enum(["equal", "percentage", "exact"]),
  groupId: z.string().optional()
})

function ExpenseForm({ type="individual", onSuccess }) {
  const [participants, setParticipants] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [splits, setSplits] = useState([]);

  const { data: currentUser } = useConvexQuery(api.users.getCurrentUser);
  const createExpense = useConvexMutation(api.expenses.createExpense);
  const categories = getAllCategories();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: "",
      amount: "",
      category: "",
      date: new Date(),
      paidByUserId: currentUser?._id || "",
      splitType: "equal",
      groupId: undefined
    }
  });

  const amountValue = watch("amount");
  const paidByUserId = watch("paidByUserId");

  useEffect(() => {
    if(participants.length === 0 && currentUser) {
      setParticipants([{
        id: currentUser._id,
        name: currentUser.name,
        email: currentUser.email,
        imageURL: currentUser.imageURL
      }])
    }
  }, [currentUser, participants]);

  async function onSubmit(data) {
    try {
      const amount = parseFloat(data.amount);

      const formattedSplits = splits.map((split) => ({
        userId: split.userId,
        amount: split.amount,
        paid: split.userId === data.paidByUserId
      }));

      const totalSplitAmount = formattedSplits.reduce((sum, split) => sum + split.amount, 0);
      const tolerance = 0.01;
      if(Math.abs(totalSplitAmount - amount) > tolerance) {
        toast.error("Total split amount does not match the expense amount");
        return;
      }

      const groupId = type === "individual" ? undefined : data.groupId;

      await createExpense.mutate({
        description: data.description,
        amount: amount,
        category: data.category || "Other",
        date: data.date.getTime(),
        paidByUserId: data.paidByUserId,
        splitType: data.splitType,
        splits: formattedSplits,
        groupId
      });

      toast.success("Expense created successfully");
      reset();

      const otherParticipant = participants.find((p) => p.id !== currentUser._id);
      const otherUserId = otherParticipant?.id;

      if(onSuccess) {
        onSuccess(type === "individual" ? otherUserId : data.groupId);
      }
    } catch (error) {
      toast.error("Failed to create expense: " + error.message);
    }
  }

  if(!currentUser) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Lunch, Movie, Vacation, etc..."
              autoComplete="off"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              placeholder="0.00"
              type="number"
              step="0.01"
              min="0.01"
              {...register("amount")}
            />
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <CategorySelector
              categories={categories || []}
              onChange={(value) => {
                if(value) {
                  setValue("category", value);
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal cursor-pointer", !selectedDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : (<span>Select a date</span>)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setValue("date", date);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {type === "group" && (
          <div className="space-y-2">
            <Label>Group</Label>
            <GroupSelector
              onChange={(group) => {
                if(!selectedGroup || selectedGroup.id !== group.id) {
                  setSelectedGroup(group);
                  setValue("groupId", group.id);
                  if(group.members && Array.isArray(group.members)) {
                    setParticipants(group.members);
                  }
                }
              }}
            />
            {!selectedGroup && (
              <p className="text-xs text-amber-600">Please select a group to continue</p>
            )}
          </div>
        )}

        {type === "individual" && (
          <div className="space-y-2">
            <Label>Participants</Label>
            <ParticipantSelector
              participants={participants}
              onParticipantsChange={setParticipants}
            />
            {participants.length <= 1 && (
              <p className="text-xs text-amber-600">Please select at least one participant</p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label>Paid By</Label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...register("paidByUserId")}
          >
            <option value="">Select who paid</option>
            {participants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id === currentUser._id ? "You" : p.name}
              </option>
            ))}
          </select>
          {errors.paidByUserId && (
            <p className="text-sm text-red-500">{errors.paidByUserId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Split Type</Label>
          <Tabs
            defaultValue="equal"
            onValueChange={(value) => setValue("splitType", value)}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="equal" className="cursor-pointer">Equal</TabsTrigger>
              <TabsTrigger value="percentage" className="cursor-pointer">Percentage</TabsTrigger>
              <TabsTrigger value="exact" className="cursor-pointer">Exact Amount</TabsTrigger>
            </TabsList>
            <TabsContent value="equal" className="pt-4">
              <p className="text-sm text-muted-foreground">
                Split the expense equally among all participants
              </p>
              <SplitSelector
                type="equal"
                amount={parseFloat(amountValue) || 0}
                participants={participants}
                paidByUserId={paidByUserId}
                onSplitsChange={setSplits}
              />
            </TabsContent>
            <TabsContent value="percentage" className="pt-4">
              <p className="text-sm text-muted-foreground">
                Split the expense by percentage among participants
              </p>
              <SplitSelector
                type="percentage"
                amount={parseFloat(amountValue) || 0}
                participants={participants}
                paidByUserId={paidByUserId}
                onSplitsChange={setSplits}
              />
            </TabsContent>
            <TabsContent value="exact" className="pt-4">
              <p className="text-sm text-muted-foreground">
                Split the expense by exact amounts for each participant
              </p>
              <SplitSelector
                type="exact"
                amount={parseFloat(amountValue) || 0}
                participants={participants}
                paidByUserId={paidByUserId}
                onSplitsChange={setSplits}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting || participants.length <= 1}
          className={(isSubmitting || participants.length <= 1) ? "" : "cursor-pointer"}
        >
          {isSubmitting ? "Creating..." : "Create Expense"}
        </Button>
      </div>
    </form>
  );
}

export default ExpenseForm;