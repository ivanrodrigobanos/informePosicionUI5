import BaseState from "./baseState";
import AppComponent from "../Component";
import ODataModel from "sap/ui/model/odata/v2/ODataModel";
import {
  AccountsData,
  FiltersAccountData,
} from "cfwreport/types/liquidityItemTypes";
import AccountLiqItemModel from "cfwreport/model/accountLiqItemModel";
import AccountLiqItemService from "cfwreport/service/accountLiqItemService";

export type AccountValue = {
  accountData: AccountLiqItemModel;
};

export default class AccountLiqItemState extends BaseState<
  AccountLiqItemService,
  AccountValue
> {
  constructor(oComponent: AppComponent) {
    super(
      oComponent,
      new AccountLiqItemService(oComponent.getModel() as ODataModel)
    );
    this.data = {
      accountData: new AccountLiqItemModel(),
    };
  }
  /**
   * Metodo que guarda los datos de las cuentas. Estos datos provienen de los
   * datos que lee la smartable
   * @param data Datos de las cuentas
   */
  setAccountData(data: AccountsData) {
    this.getData().accountData = new AccountLiqItemModel(data);
    this.updateModel();
  }
  /**
   * Lectura de los datos de cuenta con el nivel de tesoreria
   * @param data Datos de las cuentas
   */
  public async readAccountData(
    filters: FiltersAccountData
  ): Promise<AccountsData> {
    let values = await this.service.readLiquidityItemAmount(filters);
    this.getData().accountData = new AccountLiqItemModel(values);
    return this.getAccountData();
  }

  /**
   * Devuelve los datos de cuentas bancarias
   * @returns Array de cuentas bancarias
   */
  getAccountData(): AccountsData {
    return this.getData().accountData.getData();
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
