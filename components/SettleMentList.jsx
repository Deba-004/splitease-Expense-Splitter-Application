"use client";

import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/useConvexQuery";
import { Card, CardContent } from "./ui/card";
import { ArrowLeftRight } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "./ui/badge";

function SettlementList({
  settlements,
  isGroupSettelement = false,
  userLookUpMap
}) {
  const { data: currentUser } = useConvexQuery(api.users.getCurrentUser);

  if(!settlements || settlements.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No settlements found
      </div>
    );
  }

  const getUserDetails = (userId) => {
    return {
      name:
        userId === currentUser?._id
          ? "You"
          : userLookUpMap[userId]?.name || "Unknown User",
      imageURL: userLookUpMap[userId]?.imageURL || null,
      id: userId
    };
  };

  return (
    <div className="flex flex-col gap-4">
      {settlements.map((settlement) => {
        const payer = getUserDetails(settlement.paidByUserId);
        const receiver = getUserDetails(settlement.receivedByUserId);
        const isCurrentUserPayer = settlement.paidByUserId === currentUser?._id;
        const isCurrentUserReceiver = settlement.receivedByUserId === currentUser?._id;

        return (
          <Card
           key={settlement._id}
           className="hover:bg-muted/30 transition-colors"
          >
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <ArrowLeftRight className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">
                      {isCurrentUserPayer
                        ? `You paid ${receiver.name}`
                        : isCurrentUserReceiver
                          ? `${payer.name} paid you`
                          : `${payer.name} paid ${receiver.name}`
                      }
                    </h3>
                    <div className="flex items-center text-sm text-muted-foreground gap-2">
                      <span>
                        {format(new Date(settlement.date), "MMM dd, yyyy")}
                      </span>
                      {settlement.note && (
                        <>
                          <span>•</span>
                          <span>{settlement.note}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    ${settlement.amount.toFixed(2)}
                  </div>
                  {isGroupSettelement ? (
                    <Badge variant="outline" className="mt-1">
                      Group Settlement
                    </Badge>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {isCurrentUserPayer ? (
                        <span className="text-amber-500">You paid</span>
                      ) : isCurrentUserReceiver ? (
                        <span className="text-green-500">You received</span>
                      ) : (
                        <span>Payment</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default SettlementList;