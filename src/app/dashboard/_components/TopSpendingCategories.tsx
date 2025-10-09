"use client";

interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  amount: number;
  color: string;
}

interface Props {
  categories: CategoryBreakdown[];
  limit?: number;
  currency?: string;
}

export const TopSpendingCategories = ({ categories, limit = 5, currency = "USD" }: Props) => {
  if (categories.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 text-center">
        <p className="text-gray-500 text-xs sm:text-sm">No spending data available for this period.</p>
      </div>
    );
  }

  // Format as currency
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Categories are already sorted by amount descending from backend
  const topCategories = categories.slice(0, limit);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm">
      <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-3 sm:mb-4 uppercase tracking-wide">
        Top Spending Categories
      </h3>
      <div className="space-y-2 sm:space-y-3">
        {topCategories.map((category, index) => (
          <div
            key={category.categoryId}
            className="flex items-center justify-between py-1.5 sm:py-2 hover:bg-gray-50 rounded-md px-1.5 sm:px-2 -mx-1.5 sm:-mx-2 transition-colors"
          >
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              {/* Rank Number */}
              <span className="text-xs font-medium text-gray-400 w-3 sm:w-4 flex-shrink-0">
                {index + 1}.
              </span>
              
              {/* Colored Dot */}
              <div
                className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ring-2 ring-white shadow-sm"
                style={{ backgroundColor: category.color }}
              />
              
              {/* Category Name */}
              <span className="text-xs sm:text-sm font-medium text-gray-700 truncate" title={category.categoryName}>
                {category.categoryName}
              </span>
            </div>

            {/* Amount */}
            <span className="text-xs sm:text-sm font-semibold text-gray-900 ml-2 sm:ml-4 flex-shrink-0">
              {formatAmount(category.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

