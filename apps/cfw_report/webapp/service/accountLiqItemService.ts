import ODataModel from "sap/ui/model/odata/v2/ODataModel";
import BaseService from "./baseService";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import {
  AccountsData,
  FiltersAccountData,
} from "cfwreport/types/liquidityItemTypes";
import DateFormat from "cfwreport/utils/dateFormat";

type Cfw_query_liq_item = {
  results: AccountsData;
};
export default class AccountLiqItemService extends BaseService {
  constructor(oDataModel: ODataModel) {
    super(oDataModel);
  }
  /**
   * Lectura de los datos de importe de las posiciones de liquidez
   * @param filterValues Filtros de la pantalla principal
   * @returns
   */
  public async readLiquidityItemAmount(
    filterValues: FiltersAccountData
  ): Promise<AccountsData> {
    let filtersService: Filter[] = [
      new Filter(
        "p_keydate",
        FilterOperator.EQ,
        DateFormat.convertUTCDateToLocalDate(filterValues.dateFrom)
      ),
      new Filter(
        "p_enddate",
        FilterOperator.EQ,
        DateFormat.convertUTCDateToLocalDate(filterValues.dateTo)
      ),
      new Filter("currency", FilterOperator.EQ, filterValues.displayCurrency),
    ];
    let resultado = await this.odata(
      "/cfw_query_liq_item"
    ).get<Cfw_query_liq_item>({
      filters: filtersService,
    });
    return resultado.data.results;
  }
}
