"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { useConvexMutation, useConvexQuery } from "@/hooks/useConvexQuery";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const settlementSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(Number(val)) && parseFloat(val) > 0, {
      message: "Amount must be a positive number"
    }),
  note: z.string().optional(),
  paymentType: z.enum(["youPaid", "theyPaid"])
});

function SettlementForm({ entityType, entityData, onSuccess }) {
  const { data: currentUser } = useConvexQuery(api.users.getCurrentUser);
  const createSettlement = useConvexMutation(api.settlements.createSettlement);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(settlementSchema),
    defaultValues: {
      amount: "",
      note: "",
      paymentType: "youPaid"
    }
  });

  const paymentType = watch("paymentType");

  async function handleUserSettlement(data) {
    const amount = parseFloat(data.amount);
    try {
      const paidByUserId = data.paymentType === "youPaid" ? currentUser._id : entityData.counterPart.userId;
      const receivedByUserId = data.paymentType === "youPaid" ? entityData.counterPart.userId : currentUser._id;

      await createSettlement.mutate({
        amount: amount,
        note: data.note,
        paidByUserId: paidByUserId,
        receivedByUserId: receivedByUserId
      });
      toast.success("Settlement recorded successfully!");
      onSuccess();
    } catch (error) {
      toast.error(`Error creating settlement: ${error.message}`);
      console.log(error.message);
    }
  }

  async function handleGroupSettlement(data, selectedUserId) {
    if(!selectedUserId) {
      toast.error("Please select a member to settle with.");
      return;
    }

    const amount = parseFloat(data.amount);

    try {
      const selectedUser = entityData.balances.find((b) => b.userId === selectedUserId);
      if(!selectedUser) {
        toast.error("Selected member not found in group.");
        return;
      }

      const paidByUserId = data.paymentType === "youPaid" ? currentUser._id : selectedUser.userId;
      const receivedByUserId = data.paymentType === "youPaid" ? selectedUser.userId : currentUser._id;

      await createSettlement.mutate({
        amount: amount,
        note: data.note,
        paidByUserId: paidByUserId,
        receivedByUserId: receivedByUserId,
        groupId: entityData.group.id
      });
      toast.success("Settlement recorded successfully!");
      onSuccess();
    } catch (error) {
      toast.error(`Error creating settlement: ${error.message}`);
      console.log(error.message);
    }
  }

  async function onSubmit(data) {
    if(entityType === "user") {
      await handleUserSettlement(data);
    } else if(entityType === "group") {
      await handleGroupSettlement(data, selectedGroupMemberId);
    }
  }

  const [selectedGroupMemberId, setSelectedGroupMemberId] = useState(null);

  if(!currentUser) return null;

  if(entityType === "user") {
    const otherUser = entityData?.counterPart;
    const netBalance = entityData?.netBalance || 0;

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-muted p-4 rounded-lg">
          <h3 className="font-medium mb-2">Current Balance</h3>
          {netBalance === 0 ? (
            <p>You are all settled up with {otherUser.name}</p>
          ) : netBalance > 0 ? (
            <div className="flex justify-between items-center">
              <p>
                <span className="font-medium">{otherUser.name}</span> owes you
              </p>
              <span className="text-xl font-bold text-green-500">${Math.abs(netBalance).toFixed(2)}</span>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <p>
                You owe <span className="font-medium">{otherUser.name}</span>
              </p>
              <span className="text-xl font-bold text-red-500">${Math.abs(netBalance).toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Who Paid?</Label>
          <RadioGroup
            defaultValue="youPaid"
            {...register("paymentType")}
            className="flex flex-col space-y-2"
            onValueChange={(value) => {
              register("paymentType").onChange({target: { name: "paymentType", value }});
            }}
          >
            <div className="flex items-center space-x-2 border rounded-md p-3">
              <RadioGroupItem value="youPaid" id="youPaid" />
              <Label htmlFor="youPaid" className="flex-grow cursor-pointer">
                <div className="flex items-center">
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarImage src={currentUser?.imageURL} />
                    <AvatarFallback>
                      {currentUser?.name?.charAt(0) ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span>You paid {otherUser.name}</span>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 border rounded-md p-3">
              <RadioGroupItem value="theyPaid" id="theyPaid" />
              <Label htmlFor="theyPaid" className="flex-grow cursor-pointer">
                <div className="flex items-center">
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarImage src={otherUser?.imageURL} />
                    <AvatarFallback>
                      {otherUser?.name?.charAt(0) ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span>{otherUser.name} paid you</span>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount($)</Label>
          <div className="relative">
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              min="0.01"
              step="0.01"
              className="pl-7"
              {...register("amount")}
            />
          </div>
          {errors.amount && (
            <p className="text-red-500 text-sm">{errors.amount.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="note">Note (optional)</Label>
          <Textarea
            id="note"
            placeholder="Add a note..."
            className="resize-none"
            {...register("note")}
          />
        </div>

        <Button type="submit" className="w-full cursor-pointer" disabled={isSubmitting}>
          {isSubmitting ? "Recording..." : "Record Settlement"}
        </Button>
      </form>
    );
  }

  if(entityType === "group") {
    const groupMembers = entityData?.balances;
    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label>Who are you settling with?</Label>
          <div className="space-y-2">
            {groupMembers.map((member) => {
              const isSelected = selectedGroupMemberId === member.userId;
              const isOwing = member.netBalance > 0; // positive means they owe you
              const isOwed = member.netBalance < 0; // negative means you owe them
              return (
                <div
                  key={member.userId}
                  className={`border rounded-md p-3 cursor-pointer transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedGroupMemberId(member.userId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.imageURL} />
                        <AvatarFallback>
                          {member.name?.charAt(0) ?? "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{member.name}</span>
                    </div>
                    <div
                      className={`font-medium ${
                        isOwing
                          ? "text-green-500"
                          : isOwed
                          ? "text-red-500"
                          : ""
                      }`}
                    >
                      {isOwing
                        ? `They owe you $${Math.abs(member.netBalance).toFixed(2)}`
                        : isOwed
                        ? `You owe $${Math.abs(member.netBalance).toFixed(2)}`
                        : "Settled up"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {!selectedGroupMemberId && (
            <p className="text-sm text-amber-600">
              Please select a member to settle with
            </p>
          )}
        </div>

        {selectedGroupMemberId && (
          <>
            <div className="space-y-2">
              <Label>Who Paid?</Label>
              <RadioGroup
                defaultValue="youPaid"
                {...register("paymentType")}
                className="flex flex-col space-y-2"
                onValueChange={(value) => {
                  register("paymentType").onChange({
                    target: { name: "paymentType", value },
                  });
                }}
              >
                <div className="flex items-center space-x-2 border rounded-md p-3">
                  <RadioGroupItem value="youPaid" id="youPaid" />
                  <Label htmlFor="youPaid" className="flex-grow cursor-pointer">
                    <div className="flex items-center">
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarImage src={currentUser.imageURL} />
                        <AvatarFallback>
                          {currentUser.name?.charAt(0) ?? "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span>
                        You paid {groupMembers.find((m) => m.userId === selectedGroupMemberId)?.name}
                      </span>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 border rounded-md p-3">
                  <RadioGroupItem value="theyPaid" id="theyPaid" />
                  <Label htmlFor="theyPaid" className="flex-grow cursor-pointer">
                    <div className="flex items-center">
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarImage src={groupMembers.find((m) => m.userId === selectedGroupMemberId)?.imageURL} />
                        <AvatarFallback>
                          {groupMembers.find((m) => m.userId === selectedGroupMemberId)?.name?.charAt(0) ?? "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span>
                        {groupMembers.find((m) => m.userId === selectedGroupMemberId)?.name} paid you
                      </span>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount($)</Label>
              <div className="relative">
                <Input
                  id="amount"
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="pl-7"
                  {...register("amount")}
                />
              </div>
              {errors.amount && (
                <p className="text-sm text-red-500">{errors.amount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Textarea
                id="note"
                placeholder="Dinner, rent, etc."
                className="resize-none"
                {...register("note")}
              />
            </div>
          </>
        )}
        <Button
          type="submit"
          className="w-full cursor-pointer"
          disabled={isSubmitting || !selectedGroupMemberId}
        >
          {isSubmitting ? "Recording..." : "Record settlement"}
        </Button>
      </form>
    );
  }

  return null; // Fallback if no valid entityType
}

export default SettlementForm;