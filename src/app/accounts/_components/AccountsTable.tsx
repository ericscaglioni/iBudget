"use client";

import { Table } from "@/components/ui/Table";
import { accountColumns } from "./columns";
import { Account } from "@prisma/client";

export const AccountsTable = ({ data }: { data: Account[] }) => {
  return <Table data={data} columns={accountColumns} />;
}