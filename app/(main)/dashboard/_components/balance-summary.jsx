import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import Link from "next/link";

function BalanceSummary({ balances }) {
  if(!balances) {
    return null;
  }

  const { oweDetails } = balances;
  const hasOwed = oweDetails.youAreOwedBy.length > 0;
  const hasOwing = oweDetails.youOwe.length > 0;

  return (
    <div className="space-y-4">
      {!hasOwed && !hasOwing && (
        <div className="text-center py-6">
          <p className="text-muted-foreground">You're all settled up!</p>
        </div>
      )}
      {hasOwed && (
        <div>
          <h3 className="text-sm font-medium flex items-center mb-3">
            <ArrowUpCircle className="h-4 w-4 text-green-500 mr-2" />
            Owed to you
          </h3>
          <div className="space-y-3">
            {oweDetails.youAreOwedBy.map((user) => (
              <Link
                key={user.userId}
                href={`/person/${user.userId}`}
                className="flex items-center justify-between hover:bg-muted p-2 rounded-md transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.imageURL} alt={`Avatar for ${user.name}`} />
                    <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{user.name}</span>
                </div>
                <span className="font-medium text-green-500">
                  ${user.amount.toFixed(2)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {hasOwing && (
        <div>
          <h3 className="text-sm font-medium flex items-center mb-3">
            <ArrowDownCircle className="h-4 w-4 text-red-500 mr-2" />
            you owe
          </h3>
          <div className="space-y-3">
            {oweDetails.youOwe.map((user) => (
              <Link
                key={user.userId}
                href={`/person/${user.userId}`}
                className="flex items-center justify-between hover:bg-muted p-2 rounded-md transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.imageURL} alt={`Avatar for ${user.name}`} />
                    <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{user.name}</span>
                </div>
                <span className="font-medium text-green-500">
                  ${user.amount.toFixed(2)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default BalanceSummary;