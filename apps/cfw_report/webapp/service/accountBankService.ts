import ODataModel from "sap/ui/model/odata/v2/ODataModel";
import BaseService from "./baseService";
import { FiltersAccountData } from "cfwreport/state/accountBankState";
import Filter from "sap/ui/model/Filter";
import DateFormat from "cfwreport/utils/dateFormat";
import FilterOperator from "sap/ui/model/FilterOperator";
import { AccountsData } from "cfwreport/types/accountBankTypes";

type Cfw_query_plvSet = {
  results: AccountsData;
};

export default class AccountBankService extends BaseService {
  constructor(oDataModel: ODataModel) {
    super(oDataModel);
  }
  /**
   * Lectura de los datos de cuentas con los niveles de tesoreria
   * @param filterValues
   * @returns
   */
  public async readAccountPlv(
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
      new Filter(
        "p_displaycurrency",
        FilterOperator.EQ,
        filterValues.displayCurrency
      ),
    ];
    filterValues.bank_account.forEach((row) => {
      filtersService.push(new Filter("bank_account", FilterOperator.EQ, row));
    });

    if (filterValues.source)
      filtersService.push(
        new Filter("source", FilterOperator.EQ, filterValues.source)
      );

    filterValues.company_code.forEach((company) => {
      filtersService.push(
        new Filter("company_code", FilterOperator.EQ, company)
      );
    });

    let resultado = await this.odata("/cfw_query_plv").get<Cfw_query_plvSet>({
      filters: filtersService,
    });
    return resultado.data.results;
  }
}
