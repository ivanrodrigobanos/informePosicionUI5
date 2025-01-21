import { AccountAmount } from "./types";

export interface AccountData extends AccountAmount {
  liquidity_item: string;
  liquidity_item_name: string;
  currency: string;
  overdue_amount: number;
  source: string;
}
export type AccountsData = AccountData[];

export type FiltersAccountData = {
  dateFrom: Date;
  dateTo: Date;
  displayCurrency: string;
  source?: string;
  house_bank?: string[];
  company_code?: string[];
  house_bank_account?: string[];
  bank_account?: string[];
  bank_account_partner?: string[];
};
