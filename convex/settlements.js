import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

export const createSettlement = mutation({
  args: {
    amount: v.number(),
    note: v.optional(v.string()),
    paidByUserId: v.id("users"),
    receivedByUserId: v.id("users"),
    groupId: v.optional(v.id("groups")),
    relatedExpenseId: v.optional(v.array(v.id("expenses")))
  },
  handler: async (ctx, args) => {
    const currentUser = await ctx.runQuery(internal.users.getCurrentUser);

    if(args.amount <= 0) throw new Error("Settlement amount must be greater than zero.");
    if(args.paidByUserId === args.receivedByUserId) throw new Error("Payer and receiver cannot be the same user.");
    if(currentUser._id !== args.paidByUserId && currentUser._id !== args.receivedByUserId) {
      throw new Error("You must be the payer or receiver to create a settlement.");
    }

    if(args.groupId) {
      const group = await ctx.db.get(args.groupId);
      if(!group) throw new Error("Group not found.");

      const isMember = (userId) => group.members.some((m) => m.userId === userId);
      if(!isMember(args.paidByUserId) || !isMember(args.receivedByUserId)) {
        throw new Error("Both users must be members of the group to create a settlement.");
      }
    }

    return await ctx.db.insert("settlements", {
      amount: args.amount,
      note: args.note,
      date: Date.now(),
      paidByUserId: args.paidByUserId,
      receivedByUserId: args.receivedByUserId,
      groupId: args.groupId,
      relatedExpenseId: args.relatedExpenseId,
      createdBy: currentUser._id
    });
  }
});

export const getSettlementData = query({
  args: {
    entityType: v.string(), // "user" or "group"
    entityId: v.string() // ID of the user or group
  },
  handler: async (ctx, { entityType, entityId }) => {
    const currentUser = await ctx.runQuery(internal.users.getCurrentUser);

    if(entityType === "user") {
      const other = await ctx.db.get(entityId);
      if(!other) throw new Error("User not found.");

      const myExpenses = await ctx.db
        .query("expenses")
        .withIndex("by_user_and_group", (q) =>
          q.eq("paidByUserId", currentUser._id).eq("groupId", undefined)
        )
        .collect();

      const otherExpenses = await ctx.db
        .query("expenses")
        .withIndex("by_user_and_group", (q) =>
          q.eq("paidByUserId", other._id).eq("groupId", undefined)
        )
        .collect();

      const expenses = [...myExpenses, ...otherExpenses];

      let owed = 0; // they owe me
      let owing = 0; // I owe them

      for(const expense of expenses) {
        const involvesMe = expense.paidByUserId === currentUser._id || expense.splits.some(split => split.userId === currentUser._id);
        const involvesOther = expense.paidByUserId === other._id || expense.splits.some(split => split.userId === other._id);

        if(!involvesMe || !involvesOther) continue;

        if(expense.paidByUserId === currentUser._id) {
          const split = expense.splits.find(split => split.userId === other._id && !split.paid);
          if(split) owed += split.amount;
        }

        if(expense.paidByUserId === other._id) {
          const split = expense.splits.find(split => split.userId === currentUser._id && !split.paid);
          if(split) owing += split.amount;
        }
      }

      const mySettlements = await ctx.db
        .query("settlements")
        .withIndex("by_user_and_group", (q) =>
          q.eq("paidByUserId", currentUser._id).eq("groupId", undefined))
        .collect();

      const otherSettlements = await ctx.db
        .query("settlements")
        .withIndex("by_user_and_group", (q) =>
          q.eq("paidByUserId", other._id).eq("groupId", undefined))
        .collect();

      const settlements = [...mySettlements, ...otherSettlements];

      for(const st of settlements) {
        if(st.paidByUserId === currentUser._id) {
          owing = Math.max(0, owing - st.amount);
        }
        if(st.paidByUserId === other._id) {
          owed = Math.max(0, owed - st.amount);
        }
      }

      return {
        type: "user",
        counterPart: {
          userId: other._id,
          name: other.name,
          email: other.email,
          imageURL: other.imageURL
        },
        youAreOwed: owed,
        youOwe: owing,
        netBalance: owed - owing
      };
    } else if(entityType === "group") {
      const group = await ctx.db.get(entityId);
      if(!group) throw new Error("Group not found.");

      const isMember = group.members.some((m) => m.userId === currentUser._id);
      if(!isMember) throw new Error("You are not a member of this group.");

      const expenses = await ctx.db
        .query("expenses")
        .withIndex("by_group", (q) => q.eq("groupId", group._id))
        .collect();

      const balances = {};
      group.members.forEach((m) => {
        if(m.userId !== currentUser._id) {
          balances[m.userId] = { owed: 0, owing: 0 };
        }
      });
      
      for(const exp of expenses) {
        if(exp.paidByUserId === currentUser._id) {
          exp.splits.forEach((split) => {
            if(split.userId !== currentUser._id && !split.paid) {
              balances[split.userId].owed += split.amount;
            }
          });
        } else if(balances[exp.paidByUserId]) {
          const split = exp.splits.find((s) => s.userId === currentUser._id && !s.paid);
          if(split) {
            balances[exp.paidByUserId].owing += split.amount;
          }
        }
      }

      const settlements = await ctx.db
        .query("settlements")
        .filter((q) => q.eq(q.field("groupId"), group._id))
        .collect();

      for(const st of settlements) {
        if(st.paidByUserId === currentUser._id && balances[st.receivedByUserId]) {
          balances[st.receivedByUserId].owing = Math.max(0, balances[st.receivedByUserId].owing - st.amount);
        } else if(st.receivedByUserId === currentUser._id && balances[st.paidByUserId]) {
          balances[st.paidByUserId].owed = Math.max(0, balances[st.paidByUserId].owed - st.amount);
        }
      }

      const members = await Promise.all(
        Object.keys(balances).map((id) => ctx.db.get(id))
      );

      const list = Object.keys(balances).map((uid) => {
        const member = members.find((m) => m._id === uid);
        const { owed, owing } = balances[uid];
        return {
          userId: uid,
          name: member.name || "Unknown",
          email: member.email,
          imageURL: member.imageURL,
          youAreOwed: owed,
          youOwe: owing,
          netBalance: owed - owing
        };
      });

      return {
        type: "group",
        group: {
          id: group._id,
          name: group.name,
          description: group.description
        },
        balances: list
      };
    }

    throw new Error("Invalid entity type; expected 'user' or 'group'.");
  }
});