import { v } from "convex/values";
import { query } from "./_generated/server";

export const getUserWithOutstandingDebts = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const result = [];

    const expenses = await ctx.db
      .query("expenses")
      .filter((q) => q.eq(q.field("groupId"), undefined))
      .collect();

    const settlements = await ctx.db
      .query("settlements")
      .filter((q) => q.eq(q.field("groupId"), undefined))
      .collect();

    const userCache = new Map();
    const getUser = async (id) => {
      if(!userCache.has(id)) userCache.set(id, await ctx.db.get(id));
      return userCache.get(id);
    };

    for(const user of users) {
      // Map<counterpartyId, { amount: number, since: number }>
      // +amount => user owes counterparty
      // -amount => counterparty owes user
      const ledger = new Map();
      for(const expense of expenses) {
        // Case A: somebody else paid, and user appears in splits
        if(expense.paidByUserId !== user._id) {
          const split = expense.splits.find((s) => s.userId === user._id && !s.paid);
          if(!split) continue;

          const entry = ledger.get(expense.paidByUserId) ?? { amount: 0, since: expense.date };
          entry.amount += split.amount; // user owes this amount
          entry.since = Math.min(entry.since, expense.date);
          ledger.set(expense.paidByUserId, entry);
        }

        // Case B: user paid, others appear in splits
        else {
          for(const s of expense.splits) {
            if(s.userId === user._id || s.paid) continue;

            const entry = ledger.get(s.userId) ?? { amount: 0, since: expense.date };
            entry.amount -= s.amount; // counterparty owes user
            ledger.set(s.userId, entry);
          }
        }
      }

      for(const st of settlements) {
        // User paid someone → reduce positive amount owed to that someone
        if(st.paidByUserId === user._id) {
          const entry = ledger.get(st.receivedByUserId);
          if(entry) {
            entry.amount -= st.amount;
            if(entry.amount === 0) ledger.delete(st.receivedByUserId);
            else ledger.set(st.receivedByUserId, entry);
          }
        }

        // Someone paid the user → reduce negative balance (they owed user)
        else if(st.receivedByUserId === user._id) {
          const entry = ledger.get(st.paidByUserId);
          if(entry) {
            entry.amount += st.amount;
            if(entry.amount === 0) ledger.delete(st.paidByUserId);
            else ledger.set(st.paidByUserId, entry);
          }
        }
      }

      const debts = [];
      for( const [counterId, { amount, since }] of ledger) {
        if(amount > 0) {
          const counter = await getUser(counterId);
          debts.push({
            userId: counterId,
            name: counter?.name ?? "Unknown",
            amount,
            since,
          });
        }
      }

      if(debts.length > 0) {
        result.push({
          _id: user._id,
          name: user.name,
          email: user.email,
          debts
        });
      }
    }
    return result;
  }
});

export const getUserWithExpenses = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const result = [];

    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(now.getMonth() - 1);
    const monthStart = oneMonthAgo.getTime();

    for(const user of users) {
      const paidExpenses = await ctx.db
        .query("expenses")
        .withIndex("by_date", (q) => q.gte("date", monthStart))
        .filter((q) => q.eq(q.field("paidByUserId"), user._id))
        .collect();

      const allRecentExpenses = await ctx.db
        .query("expenses")
        .withIndex("by_date", (q) => q.gte("date", monthStart))
        .collect();

      const splitExpenses = allRecentExpenses.filter((e) =>
        e.splits.some((s) => s.userId === user._id)
      );

      const userExpenses = [...new Set([...paidExpenses, ...splitExpenses])];

      if(userExpenses.length > 0) {
        result.push({
          id: user._id,
          name: user.name,
          email: user.email
        });
      }
    }
    return result;
  }
});

export const getUserMonthlyExpenses = query({
  args: {
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(now.getMonth() - 1);
    const monthStart = oneMonthAgo.getTime();

    const allExpenses = await ctx.db
      .query("expenses")
      .withIndex("by_date", (q) => q.gte("date", monthStart))
      .collect();

    const userExpenses = allExpenses.filter((e) => {
      const isUserInvolved = e.paidByUserId === args.userId || e.splits.some((s) => s.userId === args.userId);
      return isUserInvolved;
    });

    return userExpenses.map((e) => {
      const userSplit = e.splits.find((s) => s.userId === args.userId);
      return {
        description: e.description,
        category: e.category,
        date: e.date,
        amount: userSplit ? userSplit.amount : 0,
        isPayer: e.paidByUserId === args.userId,
        isGroup: e.groupId !== undefined
      };
    });
  }
});