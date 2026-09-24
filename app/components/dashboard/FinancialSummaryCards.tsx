import { formatCurrency } from "@/lib/format";

export interface FinancialSummary {
  totalIncome: number;
  paidIncome: number;
  outstandingIncome: number;
  bookingCount: number;
}

interface FinancialSummaryCardsProps {
  summary: FinancialSummary;
  monthLabel: string;
}

export function FinancialSummaryCards({
  summary,
  monthLabel,
}: FinancialSummaryCardsProps) {
  const cards = [
    {
      label: `${monthLabel} income`,
      value: formatCurrency(summary.totalIncome),
    },
    { label: "Collected", value: formatCurrency(summary.paidIncome) },
    { label: "Outstanding", value: formatCurrency(summary.outstandingIncome) },
    { label: "Bookings this month", value: String(summary.bookingCount) },
  ];
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900"
        >
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {card.label}
          </p>
          <p className="mt-2 text-2xl font-semibold text-stone-900 dark:text-stone-50">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
