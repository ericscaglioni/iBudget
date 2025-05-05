import { dayjs } from "./dayjs";

export const formatCurrency = (value: number, currency: string) => {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(value);
};

export const formatDate = (date: string | Date) => {
  return dayjs(date).format("LL")
};