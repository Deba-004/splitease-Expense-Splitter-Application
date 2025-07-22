import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z, { set } from "zod";
import { Textarea } from "@/components/ui/textarea";
import { useConvexMutation, useConvexQuery } from "@/hooks/useConvexQuery";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { UserPlus, X } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { toast } from "sonner";

const groupSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  description: z.string().optional()
});

function CreateGroupModal({ isOpen, onClose, onSuccess }) {
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [commandOpen, setCommandOpen] = useState(false);

  const { data: currentUser } = useConvexQuery(api.users.getCurrentUser);
  const { data: searchUsers, isLoading: isSearching } = useConvexQuery(api.users.searchUsers, { query: searchQuery });
  const createGroup = useConvexMutation(api.contacts.createGroup);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: "",
      description: ""
    }
  });

  function addMember(member) {
    if(!selectedMembers.some((m) => m.id === member.id)) {
      setSelectedMembers([...selectedMembers, member]);
    }
    setCommandOpen(false);
    setSearchQuery("");
  }

  function removeMember(memberId) {
    setSelectedMembers(selectedMembers.filter((m) => m.id !== memberId));
  }

  const onSubmit = async (data) => {
    try {
      const memberIds = selectedMembers.map((m) => m.id);

      const groupId = await createGroup.mutate({
        name: data.name,
        description: data.description,
        members: memberIds
      });

      toast.success("Group created successfully");
      reset();
      setSelectedMembers([]);
      onClose();

      if(onSuccess) {
        onSuccess(groupId);
      }
    } catch (error) {
      toast.error("Failed to create group");
    }
  }

  function handleClose() {
    reset();
    setSelectedMembers([]);
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="name">Group Name</Label>
            <Input
              id="name"
              placeholder="Enter group name"
              autoComplete="off"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Enter group description"
              className="resize-none"
              {...register("description")}
            />
          </div>
          <div className="space-y-2">
            <Label>Members</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {currentUser && (
                <Badge variant="secondary" className="px-3 py-1">
                  <Avatar className="h-5 w-5 mr-2">
                    <AvatarImage src={currentUser.imageURL} />
                    <AvatarFallback>
                      {currentUser.name ? currentUser.name.charAt(0) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span>{currentUser.name} (You)</span>
                </Badge>
              )}
              {selectedMembers.map((member) => (
                <Badge
                  key={member.id}
                  variant="secondary"
                  className="px-3 py-1"
                >
                  <Avatar className="h-5 w-5 mr-2">
                    <AvatarImage src={member.imageURL} />
                    <AvatarFallback>
                      {member.name ? member.name.charAt(0) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span>{member.name}</span>
                  <button
                    type="button"
                    className="ml-2 text-muted-foreground hover:text-foreground cursor-pointer"
                    onClick={() => removeMember(member.id)}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              <Popover open={commandOpen} onOpenChange={setCommandOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1 text-xs cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Add Member
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start" side="bottom">
                  <Command>
                    <CommandInput
                      placeholder="Search for users..."
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {searchQuery.length < 2 ? (
                          <p className="py-3 px-4 text-sm text-center text-muted-foreground">
                            Type at least 2 characters to search
                          </p>
                        ) : isSearching ? (
                          <p className="py-3 px-4 text-sm text-center text-muted-foreground">
                            Searching...
                          </p>
                        ) : (
                          <p className="py-3 px-4 text-sm text-center text-muted-foreground">
                            No results found
                          </p>
                        )}
                      </CommandEmpty>
                      <CommandGroup heading="Users">
                        {searchUsers?.map((user) => (
                          <CommandItem
                            key={user.id}
                            value={user.name + user.email}
                            onSelect={() => addMember(user)}
                          >
                            <div className="flex items-center gap-2 cursor-pointer">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={user.imageURL} />
                                <AvatarFallback>
                                  {user.name ? user.name.charAt(0) : "U"}
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
              {selectedMembers.length === 0 && (
                <p className="text-sm text-amber-600">Select at least one other member to create group</p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
              type="submit"
              disabled={selectedMembers.length === 0 || isSubmitting}
              className="cursor-pointer"
              >
                {isSubmitting ? "Creating..." : "Create Group"}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CreateGroupModal;