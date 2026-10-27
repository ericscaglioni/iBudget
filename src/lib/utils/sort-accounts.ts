type Sortable = { name: string; sortOrder: number | null };

/**
 * The order the user chose comes first. Accounts that were never ordered (for example one created
 * after the user last reordered) come after, alphabetically.
 */
export const sortAccountsByUserOrder = <T extends Sortable>(accounts: T[]): T[] =>
  [...accounts].sort((a, b) => {
    if (a.sortOrder !== null && b.sortOrder !== null && a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }
    if (a.sortOrder !== null && b.sortOrder === null) return -1;
    if (a.sortOrder === null && b.sortOrder !== null) return 1;
    return a.name.localeCompare(b.name);
  });
