import BaseState from "./baseState";
import AppComponent from "../Component";
import AccountBankService from "cfwreport/service/accountBankService";
import AccountBankModel from "cfwreport/model/accountBankModel";
import ODataModel from "sap/ui/model/odata/v2/ODataModel";
import { HierarchyNodes } from "cfwreport/types/hierarchyTypes";
import { AccountsData } from "cfwreport/types/accountBankTypes";

export type FiltersAccountData = {
  dateFrom: Date;
  dateTo: Date;
  company_code: string[];
  displayCurrency: string;
  bank_account: string;
};
export type AccountValue = {
  accountData: AccountBankModel;
  accountPlvData: AccountBankModel;
};

export default class AccountBankState extends BaseState<
  AccountBankService,
  AccountValue
> {
  constructor(oComponent: AppComponent) {
    super(
      oComponent,
      new AccountBankService(oComponent.getModel() as ODataModel)
    );
    this.data = {
      accountData: new AccountBankModel(),
      accountPlvData: new AccountBankModel(),
    };
  }
  /**
   * Metodo que guarda los datos de las cuentas. Estos datos provienen de los
   * datos que lee la smartable
   * @param data Datos de las cuentas
   */
  setAccountData(data: AccountsData) {
    this.getData().accountData = new AccountBankModel(data);
    this.updateModel();
  }
  /**
   * Lectura de los datos de cuenta con el nivel de tesoreria
   * @param data Datos de las cuentas
   */
  public async readAccountDataPlv(filters: FiltersAccountData) {
    let values = await this.service.readAccountPlv(filters);

    this.getData().accountPlvData = new AccountBankModel(values);
    this.updateModel();
  }

  /**
   * Devuelve los datos de cuentas bancarias
   * @returns Array de cuentas bancarias
   */
  getAccountData(): AccountsData {
    return this.getData().accountData.getData();
  }
  /**
   * Devuelve los datos de cuentas bancarias con niveles de tesoreria
   * @returns Array de cuentas bancarias
   */
  getAccountDataPlv(): AccountsData {
    return this.getData().accountPlvData.getData();
  }
  /**
   * Devuelve las cuentas unicas dentro de los datos de cuentas bancarias
   * @returns Array con las cuentas únicas
   */
  getUniqueBankAccount(): HierarchyNodes {
    return this.getData().accountData.getUniqueBankAccount() ?? [];
  }
  /**
   * Devuelve si la columna overdue tiene valores
   * @returns
   */
  checkOverdueColumnWithValues(): boolean {
    return this.getData().accountData.checkOverdueColumnWithValues();
  }
  /**
   * Limpieza de los modelos de datos
   */
  public clearModelValue() {
    this.data.accountData.clearData();
    this.updateModel();
  }
}
