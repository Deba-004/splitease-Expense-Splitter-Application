"use client";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/useConvexQuery";
import { AvatarFallback } from "@radix-ui/react-avatar";
import { ArrowLeft, Users } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { BarLoader } from "react-spinners";
import SettlementForm from "./_components/SettlementForm";

function SettlementsPage() {
  const params = useParams();
  const router = useRouter();

  const { type, id } = params;

  const { data, isLoading } = useConvexQuery(api.settlements.getSettlementData, {
    entityType: type,
    entityId: id
  });

  if(isLoading) {
    return (
      <div className="container mx-auto py-12">
        <BarLoader width={"100%"} color="#36d7b7" />
      </div>
    )
  }

  function handleSuccess() {
    if(type === "user") {
      router.push(`/person/${id}`)
    } else {
      router.push(`/groups/${id}`);
    }
  }

  return (
    <div className="container mx-auto py-6 max-w-lg">
      <Button
        variant="outline"
        size="sm"
        className="mb-4 cursor-pointer"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>
      <div className="mb-6">
        <h1 className="text-5xl gradient-heading">Record a settlement</h1>
        <p className="text-muted-foreground mt-1">
          {type === "user"
            ? `Settling up with ${data?.counterPart?.name}`
            : `Settling up in ${data?.group?.name}`}
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            {type === "user" ? (
              <Avatar className="h-10 w-10">
                <AvatarImage src={data?.counterPart?.imageURL} />
                <AvatarFallback>
                  {data?.counterPart?.name?.charAt(0) ?? "U"}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="bg-primary/10 p-2 rounded-md">
                <Users className="h-6 w-6 text-primary" />
              </div>
            )}
            <CardTitle>
              {type === "user" ? data?.counterPart?.name : data?.group?.name}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <SettlementForm
            entityType={type}
            entityData={data}
            onSuccess={handleSuccess}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default SettlementsPage;