import { ENTITY_FIELDS_DATA } from "cfwreport/constants/smartConstants";
import BaseModel from "./baseModel";
import { HierarchyNodes } from "cfwreport/types/hierarchyTypes";

/*export interface AccountAmount {
  amount_data01: number;
  amount_label01: number;
  amount_data02: number;
  amount_label02: number;
  amount_data03: number;
  amount_label03: number;
  amount_data04: number;
  amount_label04: number;
  amount_data05: number;
  amount_label05: number;
  amount_data06: number;
  amount_label06: number;
  amount_data07: number;
  amount_label07: number;
  amount_data08: number;
  amount_label08: number;
  amount_data09: number;
  amount_label09: number;
  amount_data10: number;
  amount_label10: number;
  amount_data11: number;
  amount_label11: number;
  amount_data12: number;
  amount_label12: number;
  amount_data13: number;
  amount_label13: number;
  amount_data14: number;
  amount_label14: number;
  amount_data15: number;
  amount_label15: number;
  amount_data16: number;
  amount_label16: number;
  amount_data17: number;
  amount_label17: number;
  amount_data18: number;
  amount_label18: number;
  amount_data19: number;
  amount_label19: number;
  amount_data20: number;
  amount_label20: number;
  amount_data21: number;
  amount_label21: number;
  amount_data22: number;
  amount_label22: number;
  amount_data23: number;
  amount_label23: number;
  amount_data24: number;
  amount_label24: number;
  amount_data25: number;
  amount_label25: number;
  amount_data26: number;
  amount_label26: number;
  amount_data27: number;
  amount_label27: number;
  amount_data28: number;
  amount_label28: number;
  amount_data29: number;
  amount_label29: number;
  amount_data30: number;
  amount_label30: number;
  amount_data31: number;
  amount_label31: number;
}*/
export type AccountAmount = Record<string, number | string>;
export interface AccountData extends AccountAmount {
  bank_account: string;
  bank_account_partner: string;
  company_code: string;
  company_code_name: string;
  bank_currency: string;
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
