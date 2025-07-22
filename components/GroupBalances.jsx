"use client";

import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/useConvexQuery";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { Avatar } from "./ui/avatar";
import { AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";

function GroupBalances({ balances }) {
  const { data:currentUser } = useConvexQuery(api.users.getCurrentUser);
  if(!currentUser || balances?.length === 0) {{
    return (
      <div className="text-center py-4 text-muted-foreground">
        No balance information available
      </div>
    );
  }}

  const me = balances.find((b) => b.id === currentUser?._id);
  if(!me) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        You have no balance in this group
      </div>
    );
  }

  const userMap = Object.fromEntries(balances.map((b) => [b.id, b]));

  const owedByMembers = me.owedBy
    .map(({ from, amount }) => ({ ...userMap[from], amount }))
    .sort((a, b) => b.amount - a.amount);

  const owingToMembers = me.owes
    .map(({ to, amount }) => ({ ...userMap[to], amount }))
    .sort((a, b) => b.amount - a.amount);

  const isAllSettledUp = me.totalBalance === 0 && owedByMembers.length === 0 && owingToMembers.length === 0;

  return (
    <div className="space-y-4">
      <div className="]text-center pb-4 border-b">
        <p className="text-sm text-muted-foreground mb-1">Your Balance</p>
        <p
          className={`text-2xl font-semibold ${
            me.totalBalance > 0
              ? "text-green-500"
              : me.totalBalance < 0
                ? "text-red-500"
                : ""
          }`}
        >
          {me.totalBalance > 0
            ? `+$${me.totalBalance.toFixed(2)}`
            : me.totalBalance < 0
              ? `-$${Math.abs(me.totalBalance).toFixed(2)}`
              : "&0.00"}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {me.totalBalance > 0
            ? "You are owed money"
            : me.totalBalance < 0
              ? "You owe money"
              : "You are all settled up!"}
        </p>
      </div>

      {isAllSettledUp ? (
        <div className="text-center py-4">
          <div className="text-muted-foreground">Everyone is settled up!</div>
        </div>
      ) : (
        <div className="space-y-4">
          {owedByMembers.length > 0 && (
            <div>
              <h3 className="text-sm font-medium flex items-center mb-3">
                <ArrowUpCircle className="h-4 w-4 text-green-500 mr-2" />
                Owed to You
              </h3>
              <div className="space-y-3">
                {owedByMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className='w-8 h-8'>
                        <AvatarImage src={member.imageURL} />
                        <AvatarFallback>
                          {member.name?.charAt(0) ?? "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{member.name}</span>
                    </div>
                    <span className="font-medium text-green-500">
                      ${member.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {owingToMembers.length > 0 && (
            <div>
              <h3 className="text-sm font-medium flex items-center mb-3">
                <ArrowDownCircle className="h-4 w-4 text-red-500 mr-2" />
                You Owe
              </h3>
              <div className="space-y-3">
                {owingToMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className='w-8 h-8'>
                        <AvatarImage src={member.imageURL} />
                        <AvatarFallback>
                          {member.name?.charAt(0) ?? "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{member.name}</span>
                    </div>
                    <span className="font-medium text-red-500">
                      ${member.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GroupBalances;