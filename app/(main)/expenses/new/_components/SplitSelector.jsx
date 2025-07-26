"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { email } from "zod";

function SplitSelector({ type, amount, participants, paidByUserId, onSplitsChange }) {
  const { user } = useUser();

  const [splits, setSplits] = useState([]);
  const [totalPercentage, setTotalPercentage] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    if(!amount || amount <= 0 || participants.length === 0) return;

    let newSplits = [];
    if(type === "equal") {
      const shareAmount = amount / participants.length;
      newSplits = participants.map((participant) => ({
        userId: participant.id,
        name: participant.name,
        email: participant.email,
        imageURL: participant.imageURL,
        amount: shareAmount,
        percentage: 100 / participants.length,
        paid: participant.id === paidByUserId
      }));
    } else if(type === "percentage") {
      const evenPercentage = 100 / participants.length;
      newSplits = participants.map((participant) => ({
        userId: participant.id,
        name: participant.name,
        email: participant.email,
        imageURL: participant.imageURL,
        amount: (evenPercentage / 100) * amount,
        percentage: evenPercentage,
        paid: participant.id === paidByUserId
      }));
    } else if(type === "exact") {
      const evenAmont = amount / participants.length;
      newSplits = participants.map((participant) => ({
        userId: participant.id,
        name: participant.name,
        email: participant.email,
        imageURL: participant.imageURL,
        amount: evenAmont,
        percentage: (evenAmont / amount) * 100,
        paid: participant.id === paidByUserId
      }));
    }

    setSplits(newSplits);

    const newTotalAmount = newSplits.reduce((sum, split) => sum + split.amount, 0);
    const newTotalPercentage = newSplits.reduce((sum, split) => sum + split.percentage, 0);

    setTotalAmount(newTotalAmount);
    setTotalPercentage(newTotalPercentage);

    if(onSplitsChange) {
      onSplitsChange(newSplits);
    }
  }, [type, amount, participants, paidByUserId, onSplitsChange]);

  function updatePercentageSplit(userId, newPercentage) {
    const updatedSplits = splits.map((split) => {
      if(split.userId === userId) {
        return {
          ...split,
          percentage: newPercentage,
          amount: (newPercentage / 100) * amount
        }
      }
      return split;
    });

    setSplits(updatedSplits);

    const newTotalAmount = updatedSplits.reduce((sum, split) => sum + split.amount, 0);
    const newTotalPercentage = updatedSplits.reduce((sum, split) => sum + split.percentage, 0);

    setTotalAmount(newTotalAmount);
    setTotalPercentage(newTotalPercentage);

    if(onSplitsChange) {
      onSplitsChange(updatedSplits);
    }
  }

  function updateExactSplit(userId, newAmount) {
    const parsedAmount = parseFloat(newAmount) || 0;

    const updatedSplits = splits.map((split) => {
      if(split.userId === userId) {
        const percentage = (parsedAmount / amount) * 100;
        return {
          ...split,
          amount: parsedAmount,
          percentage: amount > 0 ? percentage : 0
        };
      }
      return split;
    });

    setSplits(updatedSplits);

    const newTotalAmount = updatedSplits.reduce((sum, split) => sum + split.amount, 0);
    const newTotalPercentage = updatedSplits.reduce((sum, split) => sum + split.percentage, 0);

    setTotalAmount(newTotalAmount);
    setTotalPercentage(newTotalPercentage);

    if(onSplitsChange) {
      onSplitsChange(updatedSplits);
    }
  }

  const isPercentageValid = Math.abs(totalPercentage - 100) < 0.01;
  const isAmountValid = Math.abs(totalAmount - amount) < 0.01;

  return (
    <div className="space-y-4 mt-4">
      {splits.map((split) => (
        <div key={split.userId} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-[120px]">
            <Avatar className="w-7 h-7">
              <AvatarImage src={split.imageURL} />
              <AvatarFallback>
                {split.name?.charAt(0) ?? "U"}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">
              {split.userId === user.id ? "You" : split.name}
            </span>
          </div>

          {type === "equal" && (
            <div className="text-right text-sm">
              ${split.amount.toFixed(2)} ({split.percentage.toFixed(1)}%)
            </div>
          )}

          {type === "percentage" && (
            <div className="flex items-center gap-4 flex-1">
              <Slider
                value={[split.percentage]}
                min={0}
                max={100}
                step={1}
                onValueChange={(values) => updatePercentageSplit(split.userId, values[0])}
                className="flex-1"
              />
              <div className="flex gap-1 items-center min-w-[100px]">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={split.percentage.toFixed(1)}
                  onChange={(e) => updatePercentageSplit(split.userId, parseFloat(e.target.value) || 0)}
                  className="w-16 h-8"
                />
                <span className="text-sm text-muted-foreground">%</span>
                <span className="text-sm ml-1">${split.amount.toFixed(2)}</span>
              </div>
            </div>
          )}

          {type === "exact" && (
            <div className="flex items-center gap-2 flex-1">
              <div className="flex-1"></div>
              <div className="flex gap-1 items-center">
                <span className="text-sm text-muted-foreground">$</span>
                <Input
                  type="number"
                  min="0"
                  max={amount * 2}
                  step="0.01"
                  value={split.amount.toFixed(2)}
                  onChange={(e) => updateExactSplit(split.userId, e.target.value)}
                  className="w-24 h-8"
                />
                <span className="text-sm text-muted-foreground ml-1">{split.percentage.toFixed(1)}%</span>
              </div>
            </div>
          )}
        </div>
      ))}

      <div className="flex justify-between border-t pt-3 mt-3">
        <span className="font-medium">Total</span>
        <div className="text-right">
          <span className={`font-medium ${!isAmountValid ? "text-amber-600" : ""}`}>${totalAmount.toFixed(2)}</span>
          {type !== "equal" && (
            <span className={`text-sm ml-2 ${!isPercentageValid ? "text-amber-600" : ""}`}>
              ({totalPercentage.toFixed(1)}%)
            </span>
          )}
        </div>
      </div>

      {type === "percentage" && !isPercentageValid && (
        <div className="text-amber-600 text-sm mt-2">
          Total percentage must equal 100%.
        </div>
      )}

      {type === "exact" && !isAmountValid && (
        <div className="text-amber-600 text-sm mt-2">
          Total amount must equal the specified total amount.
        </div>
      )}
    </div>
  );
}

export default SplitSelector;