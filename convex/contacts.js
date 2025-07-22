import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

export const getAllContacts = query({
  handler: async (ctx) => {
    const currentUser = await ctx.runQuery(internal.users.getCurrentUser);

    const expensesYouPaid = await ctx.db
      .query("expenses")
      .withIndex("by_user_and_group", (q) => q.eq("paidByUserId", currentUser._id).eq("groupId", undefined))
      .collect();

    const expensesNotPaidByYou = (
      await ctx.db
        .query("expenses")
        .withIndex("by_group", (q) => q.eq("groupId", undefined))
        .collect()
    ).filter((expense) => expense.paidByUserId !== currentUser._id && expense.splits.some((split) => split.userId === currentUser._id));

    const personalExpenses = [...expensesYouPaid, ...expensesNotPaidByYou];

    const contactIds = new Set();
    personalExpenses.forEach((expense) => {
      if(expense.paidByUserId !== currentUser._id) {
        contactIds.add(expense.paidByUserId);
      }

      expense.splits.forEach((split) => {
        if(split.userId !== currentUser._id) {
          contactIds.add(split.userId);
        }
      });
    });

    const contacts = await Promise.all(
      [...contactIds].map(async (id) => {
        const u = await ctx.db.get(id);

        return u ? {
          id: u._id,
          name: u.name,
          email: u.email,
          imageURL: u.imageURL,
          type: "user"
        } : null;
      })
    );

    const userGroups = (
      await ctx.db
        .query("groups")
        .collect()
    )
    .filter((group) => group.members.some((member) => member.userId === currentUser._id))
    .map((group) => ({
      id: group._id,
      name: group.name,
      description: group.description,
      memberCount: group.members.length,
      type: "group"
    }));

    contacts.sort((a, b) => a?.name.localeCompare(b?.name));
    userGroups.sort((a, b) => a.name.localeCompare(b.name));

    return {
      users: contacts.filter(Boolean),
      groups: userGroups
    };
  }
});

export const createGroup = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    members: v.array(v.id("users"))
  },
  handler: async (ctx, args) => {
    const currentUser = await ctx.runQuery(internal.users.getCurrentUser);
    if(!args.name.trim()) throw new Error("Group name cannot be empty");
    const uniqueMembers = new Set(args.members);
    uniqueMembers.add(currentUser._id);

    for(const id of uniqueMembers) {
      if(!await ctx.db.get(id)) throw new Error(`User with ID ${id} does not exist`);
    }

    return await ctx.db.insert("groups", {
      name: args.name,
      description: args.description,
      createdBy: currentUser._id,
      members: [...uniqueMembers].map((id) => ({
        userId: id,
        role: id === currentUser._id ? "admin" : "member",
        joinedAt: Date.now()
      }))
    });
  }
});