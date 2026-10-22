import { post } from "@/lib/api/client";

export type TipId = "checklist" | "multi-currency";

export const dismissTip = async (tipId: TipId) => {
  return post<{ tipId: TipId }, { tipId: TipId }>("/api/guide/dismiss", { tipId });
};
