import { v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";

export const createExpense = mutation({
  args: {
    description: v.string(),
    amount: v.number(),
    category: v.optional(v.string()),
    date: v.number(),
    paidByUserId: v.id("users"),
    splitType: v.string(),
    splits: v.array(v.object({
      userId: v.id("users"),
      amount: v.number(),
      paid: v.boolean()
    })),
    groupId: v.optional(v.id("groups")),
  },
  handler: async (ctx, args) => {
    const currentUser = await ctx.runQuery(internal.users.getCurrentUser);
    if(!currentUser) throw new Error("User not found");

    if(args.groupId) {
      const group = await ctx.db.get(args.groupId);
      if(!group) throw new Error("Group not found");

      const isMember = group.members.some((m) => m.userId === currentUser._id);
      if(!isMember) throw new Error("User is not a member of the group");
    }

    const totalSplitAmount = args.splits.reduce((sum, s) => sum + s.amount, 0);
    const tolerance = 0.01; // Allow a small tolerance for floating point errors
    if(Math.abs(totalSplitAmount - args.amount) > tolerance) {
      throw new Error("Total split amount does not match the expense amount");
    }

    const expanseId = ctx.db.insert("expenses", {
      description: args.description,
      amount: args.amount,
      category: args.category || "Other",
      date: args.date,
      paidByUserId: args.paidByUserId,
      splitType: args.splitType,
      splits: args.splits,
      groupId: args.groupId,
      createdBy: currentUser._id
    });

    return expanseId;
  }
});

export const getExpensebetweenUsers = query({
  args: { userId: v.id("users")},

  handler: async (ctx, { userId }) => {
    const currentUser = await ctx.runQuery(internal.users.getCurrentUser);
    if(currentUser._id === userId) throw new Error("Cannot get expenses between the same user");

    /* ───── 1. One-on-one expenses where either user is the payer ───── */
    const myPaid = await ctx.db
      .query("expenses")
      .withIndex("by_user_and_group", (q) => q.eq("paidByUserId", currentUser._id).eq("groupId", undefined))
      .collect();

    const theirPaid = await ctx.db
      .query("expenses")
      .withIndex("by_user_and_group", (q) => q.eq("paidByUserId", userId).eq("groupId", undefined))
      .collect();

    const myExpenses = [...myPaid, ...theirPaid];

    const expenses = myExpenses.filter((expense) => {
      const meSplits = expense.splits.filter((s) => s.userId === currentUser._id);
      const themSplits = expense.splits.filter((s) => s.userId === userId);

      const meInvolved = expense.paidByUserId === currentUser._id || meSplits.length > 0;
      const themInvolved = expense.paidByUserId === userId || themSplits.length > 0;

      return meInvolved && themInvolved;
    });

    expenses.sort((a, b) => b.date - a.date);

    /* ───── 2. Settlements between the two of us (groupId = undefined) ─ */
    const settlements = await ctx.db
      .query("settlements")
      .filter((q) =>
        q.and(
          q.eq(q.field("groupId"), undefined),
          q.or(
            q.and(
              q.eq(q.field("paidByUserId"), currentUser._id),
              q.eq(q.field("receivedByUserId"), userId)
            ),
            q.and(
              q.eq(q.field("paidByUserId"), userId),
                q.eq(q.field("receivedByUserId"), currentUser._id)
            )
          )
        )).collect();

    settlements.sort((a, b) => b.date - a.date);

    /* ───── 3. Compute running balance ──────────────────────────────── */
    let balance = 0;

    for(const e of expenses) {
      if(e.paidByUserId === currentUser._id) {
        const split = e.splits.find((s) => s.userId === userId && !s.paid);
        if(split) balance += split.amount;
      } else {
        const split = e.splits.find((s) => s.userId === currentUser._id && !s.paid);
        if(split) balance -= split.amount;
      }
    }

    for(const s of settlements) {
      if(s.paidByUserId === currentUser._id) {
        balance += s.amount;
      } else {
        balance -= s.amount;
      }
    }

    const other = await ctx.db.get(userId);
    if(!other) throw new Error("User not found");

    return {
      expenses,
      settlements,
      otherUser: {
        id: other._id,
        name: other.name,
        email: other.email,
        imageURL: other.imageURL
      },
      balance
    }
  }
});

export const deleteExpense = mutation({
  args: { expenseId: v.id("expenses") },

  handler: async (ctx, { expenseId }) => {
    const currentUser = await ctx.runQuery(internal.users.getCurrentUser);

    const expense = await ctx.db.get(expenseId);
    if(!expense) throw new Error("Expense not found");

    if(expense.createdBy !== currentUser._id && expense.paidByUserId !== currentUser._id) {
      throw new Error("You are not authorized to delete this expense");
    }

    const allSettlements = await ctx.db.query("settlements").collect();
    const relatedSettlements = allSettlements.filter((s) =>
      s.relatedExpenseId !== undefined &&
      s.relatedExpenseId.includes(expenseId)
    );

    for(const s of relatedSettlements) {
      const updatedRelatedExpenseId = s.relatedExpenseId.filter(id => id !== expenseId);
      if(updatedRelatedExpenseId.length === 0) {
        await ctx.db.delete(s._id);
      } else {
        await ctx.db.patch(s._id, { relatedExpenseId: updatedRelatedExpenseId })
      }
    }

    await ctx.db.delete(expenseId);

    return { success: true };
  }
});