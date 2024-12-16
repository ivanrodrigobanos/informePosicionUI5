import { ENTITY_FIELDS_DATA } from "liqreport/constants/smartConstants";
import BaseModel from "./baseModel";
import { AccountData, AccountsData } from "liqreport/types/liquidityItemTypes";

export default class AccountLiqItemModel extends BaseModel<AccountsData> {
  private accountsData: AccountsData;
  private overDueColumWithValues: boolean;
  constructor(data?: AccountsData) {
    super();
    this.accountsData = [];

    this.overDueColumWithValues = false;

    if (data) {
      this.accountsData = this.transformData(data);
      // Determina si la columna de importes en overDue tiene valores
      this.overDueColumWithValues = this.determineOverdueColumnWithValues();
    }
  }
  public getData(): AccountsData {
    return this.accountsData;
  }
  public clearData(): void {
    this.accountsData = [];
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

  public checkOverdueColumnWithValues() {
    return this.overDueColumWithValues;
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
