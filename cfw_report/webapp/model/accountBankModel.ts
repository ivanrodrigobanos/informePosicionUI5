import { ENTITY_FIELDS_DATA } from "cfwreport/constants/smartConstants";
import BaseModel from "./baseModel";
import { HierarchyNodes } from "cfwreport/types/hierarchyTypes";

export type AccountAmount = Record<string, number | string>;
export interface AccountData extends AccountAmount {
  bank_account: string;
  bank_account_partner: string;
  company_code: string;
  company_code_name: string;
  currency: string;
  house_bank: string;
  house_bank_account: string;
  planning_level: string;
  //p_keydate: string;
  // p_enddate: string;
  // p_displaycurrency: string;
}

export type AccountsData = AccountData[];

export default class AccountBankModel extends BaseModel<AccountsData> {
  private accountsData: AccountsData;
  private _uniqueBankAccount: HierarchyNodes;
  constructor(data?: any[]) {
    super();
    this.accountsData = [];
    this._uniqueBankAccount = [];

    if (data) {
      this.accountsData = this.transformData(data);
      // Se obtiene las cuentas unicas de banco para usar en procesos como de jerarquía
      this._uniqueBankAccount = this.extractBankAccounts(data);
    }
  }
  public getData(): AccountsData {
    return this.accountsData;
  }
  public clearData(): void {
    this.accountsData = [];
    this._uniqueBankAccount = [];
  }
  public transformData(data: any[]): AccountsData {
    let accountsData: AccountsData = [];

    data.forEach((rowData) => {
      let accountData: Partial<AccountData> = {};

      Object.keys(rowData).forEach((key) => {
        // Los campos importe se transforman a number ya que del servicio viene en formato char. Y provoca
        // que en visualizaciones en jerarquía no funcione correctamente
        if (key.includes(ENTITY_FIELDS_DATA.AMOUNT_DATA))
          accountData[key] = Number(rowData[key]);
        else accountData[key] = rowData[key];
      });
      accountsData.push(accountData as AccountData);
    });

    return accountsData;
  }
  /**
   *
   * @returns
   */
  public getUniqueBankAccount(): HierarchyNodes {
    return this._uniqueBankAccount;
  }

  private extractBankAccounts(rawData: AccountsData): HierarchyNodes {
    return [...new Set(rawData.map((item) => item.bank_account))];
  }
}
