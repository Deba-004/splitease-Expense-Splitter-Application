import { v } from "convex/values";
import { query } from "./_generated/server";
import { internal } from "./_generated/api";

export const getGroupsExpenses = query({
  args: { groupId: v.id("groups") },

  handler: async (ctx, { groupId} ) => {
    const currentUser = await ctx.runQuery(internal.users.getCurrentUser);

    const group = await ctx.db.get(groupId);
    if(!group) throw new Error("Group not found");

    if(!group.members.some((m) => m.userId === currentUser._id)) throw new Error("You are not a member of this group");

    const expenses = await ctx.db
       .query("expenses")
       .withIndex("by_group", (q) => q.eq("groupId", groupId))
       .collect();

    const settlements = await ctx.db
      .query("settlements")
      .filter((q) => q.eq(q.field("groupId"), groupId))
      .collect();

    const memberDetails = await Promise.all(
      group.members.map(async (m) => {
        const u = await ctx.db.get(m.userId);
        return {
          id: u._id,
          name: u.name,
          imageURL: u.imageURL,
          role: m.role
        };
      })
    );

    const ids = group.members.map((m) => m.userId);

    /* ----------  ledgers ---------- */
    const total = Object.fromEntries(ids.map((id) => [id, 0]));
    // pair‑wise ledger  debtor -> creditor -> amount
    //ledgers[a][b] = how much a owes b
    const ledgers = {};
    ids.forEach((a) => {
      ledgers[a] = {};
      ids.forEach((b) => {
        if(a != b) {
          ledgers[a][b] = 0;
        }
      });
    });

    //Aplly expenses
    for(const e of expenses) {
      const payer = e.paidByUserId;
      for(const s of e.splits) {
        if(s.userId === payer || s.paid) continue;
        const debtor = s.userId;
        const amount = s.amount;

        total[payer] += amount;
        total[debtor] -= amount;

        ledgers[debtor][payer] += amount;
      }
    }

    //Apply settlements
    for(const s of settlements) {
      total[s.paidByUserId] += s.amount;
      total[s.receivedByUserId] -= s.amount;

      ledgers[s.paidByUserId][s.receivedByUserId] -= s.amount;
    }

    ids.forEach((a) => {
      ids.forEach((b) => {
        if(a >= b) return;

        const diff = ledgers[a][b] - ledgers[b][a];
        if(diff > 0) {
          ledgers[a][b] = diff;
          ledgers[b][a] = 0;
        } else if(diff < 0) {
          ledgers[b][a] = -diff;
          ledgers[a][b] = 0;
        } else {
          ledgers[a][b] = ledgers[b][a] = 0;
        }
      });
    });

    const balances = memberDetails.map((m) => ({
      ...m,
      totalBalance: total[m.id],
      owes: Object.entries(ledgers[m.id])
        .filter(([, v]) => v > 0)
        .map(([to, amount]) => ({ to, amount })),
      owedBy: ids
        .filter((other) => ledgers[other][m.id] > 0)
        .map((other) => ({ from: other, amount: ledgers[other][m.id] }))
    }));

    const userLookUpMap = {};
    memberDetails.forEach((member) => {
      userLookUpMap[member.id] = member;
    });

    return {
      group: {
        id: group._id,
        name: group.name,
        description: group.description
      },
      members: memberDetails,
      expenses,
      settlements,
      balances,
      userLookUpMap
    };
  }
});

export const getGrouporMembers = query({
  args: { groupId: v.optional(v.id("groups")) },
  handler: async (ctx, args) => {
    const currentUser = await ctx.runQuery(internal.users.getCurrentUser);

    const allGroups = await ctx.db.query("groups").collect();
    const userGroups = allGroups.filter((g) =>
      g.members.some((m) => m.userId === currentUser._id)
    );

    if(args.groupId) {
      const selectedGroup = userGroups.find((g) => g._id === args.groupId);
      if(!selectedGroup) throw new Error("Group not found or you are not a member");

      const memberDetails = await Promise.all(
        selectedGroup.members.map(async (m) => {
          const user = await ctx.db.get(m.userId);
          return {
            id: user._id,
            name: user.name,
            email: user.email,
            imageURL: user.imageURL,
            role: m.role
          };
        })
      );

      const validMembers = memberDetails.filter((m) => m !== null);
      
      return {
        selectedGroup: {
          id: selectedGroup._id,
          name: selectedGroup.name,
          description: selectedGroup.description,
          createdBy: selectedGroup.createdBy,
          members: validMembers
        },
        groups: userGroups.map((g) => ({
          id: g._id,
          name: g.name,
          description: g.description,
          memberCount: g.members.length
        }))
      };
    } else {
      return {
        selectedGroup: null,
        groups: userGroups.map((g) => ({
          id: g._id,
          name: g.name,
          description: g.description,
          memberCount: g.members.length
        }))
      };
    }
  }
});