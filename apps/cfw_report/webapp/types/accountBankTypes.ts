import { AccountAmount } from "./types";

export interface AccountData extends AccountAmount {
  bank_account: string;
  bank_account_partner: string;
  company_code: string;
  company_code_name: string;
  currency: string;
  house_bank: string;
  house_bank_account: string;
  planning_level: string;
  planning_level_name: string;
  overdue_amount: number;
  source: string;
  bank_account_number: string;
  bank_account_key: string;
}
export type AccountsData = AccountData[];
