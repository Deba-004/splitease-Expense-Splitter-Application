"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/useConvexQuery";
import { UserPlus, X } from "lucide-react";
import { useState } from "react";

function ParticipantSelector({ participants, onParticipantsChange }) {
  const { data: currentUser } = useConvexQuery(api.users.getCurrentUser);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: searchResults, isLoading } = useConvexQuery(api.users.searchUsers, { query: searchQuery });

  function addParticipant(user) {
    if(participants.some((p) => p.id === user.id)) return;
    onParticipantsChange([...participants, user]);
    setSearchQuery("");
    setOpen(false);
  }

  function removeParticipant(userId) {
    if(userId === currentUser._id) return;
    onParticipantsChange(participants.filter((p) => p.id !== userId));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {participants.map((participant) => (
          <Badge
            key={participant.id}
            className="flex items-center gap-2 px-3 py-2"
            variant="secondary"
          >
            <Avatar className="w-5 h-5">
              <AvatarImage src={participant.imageURL} />
              <AvatarFallback>
                {participant.name?.charAt(0) ?? "U"}
              </AvatarFallback>
            </Avatar>
            <span>
              {participant.id === currentUser._id ? "You" : participant.name || participant.email}
            </span>
            {participant.id !== currentUser._id && (
              <button
                type="button"
                className="ml-1 text-muted-foreground hover:text-foreground cursor-pointer"
                onClick={() => removeParticipant(participant.id)}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </Badge>
        ))}

        {participants.length < 2 && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1 text-xs cursor-pointer"
                type="button"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Add Participant
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="start">
              <Command>
                <CommandInput
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                />
                <CommandList>
                  <CommandEmpty>
                    {searchQuery.length < 2 ? (
                      <p className="py-3 px-4 text-sm text-center text-muted-foreground">
                        Type at least 2 characters to search
                      </p>
                    ) : isLoading ? (
                      <p className="py-3 px-4 text-sm text-center text-muted-foreground">
                        Searching...
                      </p>
                    ) : (
                      <p className="py-3 px-4 text-sm text-center text-muted-foreground">
                        No users found
                      </p>
                    )}
                  </CommandEmpty>
                  <CommandGroup heading="Users">
                    {searchResults?.map((user) => (
                      <CommandItem
                        key={user.id}
                        value={user.name + user.email}
                        onSelect={() => addParticipant(user)}
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={user.imageURL} />
                            <AvatarFallback>
                              {user.name?.charAt(0) ?? "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm">{user.name}</span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
}

export default ParticipantSelector;