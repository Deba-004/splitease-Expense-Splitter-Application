import { Bell, CreditCard, PieChart, Receipt, Users } from "lucide-react";

export const features = [
  {
    title: "Group Expenses",
    Icon: Users,
    bg: "bg-green-100",
    color: "text-green-500",
    description: "Easily manage expenses with friends, family, or roommates." 
  }, {
    title: "Smart Settlements",
    Icon: CreditCard,
    bg: "bg-teal-100",
    color: "text-teal-500",
    description: "Our algorithm minimises the number of payments when settling up."
  }, {
    title: "Expense Analysis",
    Icon: PieChart,
    bg: "bg-amber-100",
    color: "text-amber-500",
    description: "Get insights into your spending patterns and trends."
  }, {
    title: "Paymenet Reminder",
    Icon: Bell,
    bg: "bg-green-100",
    color: "text-green-500",
    description: "Automated reminders for pending debts and insights on spending patterns."
  }, {
    title: "Multiple Split Types",
    Icon: Receipt,
    bg: "bg-teal-100",
    color: "text-teal-500",
    description: "Support for various expense splitting methods."
  }, {
    title: "Real-time Updates",
    Icon: () => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 14v8M15 14v8M9 2v6M15 2v6" />
      </svg>
    ),
    bg: "bg-amber-100",
    color: "text-amber-500",
    description: "See new expenses and repayments the moment your friends add them."
  }
];

export const steps = [
  {
    label: 1,
    title: "Create or Join a Group",
    description: "Start by creating a new group or joining an existing one to manage your shared expenses."
  }, {
    label: 2,
    title: "Add Expenses",
    description: "Easily add expenses with details like amount, description, and who paid."
  }, {
    label: 3,
    title: "Settle Up",
    description: "View who owes what and log payments when debts are cleared."
  }
];