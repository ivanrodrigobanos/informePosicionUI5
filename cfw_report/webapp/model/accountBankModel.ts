import { ENTITY_FIELDS_DATA } from "cfwreport/constants/smartConstants";
import BaseModel from "./baseModel";
import { HierarchyNodes } from "cfwreport/types/hierarchyTypes";
import { AccountData, AccountsData } from "cfwreport/types/accountBankTypes";

export default class AccountBankModel extends BaseModel<AccountsData> {
  private accountsData: AccountsData;
  private _uniqueBankAccount: HierarchyNodes;
  private overDueColumWithValues: boolean;
  constructor(data?: any[]) {
    super();
    this.accountsData = [];
    this._uniqueBankAccount = [];
    this.overDueColumWithValues = false;

    if (data) {
      this.accountsData = this.transformData(data);
      // Se obtiene las cuentas unicas de banco para usar en procesos como de jerarquía
      this._uniqueBankAccount = this.extractBankAccounts(data);
      // Determina si la columna de importes en overDue tiene valores
      this.overDueColumWithValues = this.determineOverdueColumnWithValues();
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

    data.forEach((rowData: any) => {
      let accountData: Partial<AccountData> = {};

      Object.keys(rowData).forEach((key) => {
        // Los campos importe se transforman a number ya que del servicio viene en formato char. Y provoca
        // que en visualizaciones en jerarquía no funcione correctamente
        if (
          key.includes(ENTITY_FIELDS_DATA.AMOUNT_DATA) ||
          key.includes(ENTITY_FIELDS_DATA.OVERDUE_AMOUNT)
        )
          accountData[key] = Number(rowData[key]);
        else accountData[key] = rowData[key];
      });
      accountsData.push(accountData as AccountData);
    });

    return accountsData;
  }
  /**
   * Devuelve las cuentas de bancos unicas
   * @returns
   */
  public getUniqueBankAccount(): HierarchyNodes {
    return this._uniqueBankAccount;
  }
  public checkOverdueColumnWithValues() {
    return this.overDueColumWithValues;
  }
  // Extre los las cuentas de bancos quitando duplicados
  private extractBankAccounts(rawData: AccountsData): HierarchyNodes {
    return [...new Set(rawData.map((item) => item.bank_account))];
  }
  /**
   * Determina si hay datos en la columna de overDude
   * @returns
   */
  private determineOverdueColumnWithValues() {
    if (this.getData().findIndex((row) => row.overdue_amount !== 0) === -1)
      return false;
    else return true;
  }
}
