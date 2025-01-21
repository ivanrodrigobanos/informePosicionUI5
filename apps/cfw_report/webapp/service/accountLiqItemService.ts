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
    if (filterValues.house_bank == undefined) {
    } else if (filterValues.house_bank.length > 0) {
      filterValues.house_bank.forEach((houseBank) => {
        filtersService.push(
          new Filter("house_bank", FilterOperator.EQ, houseBank)
        );
      });
    }
    if (filterValues.company_code == undefined) {
    } else if (filterValues.company_code.length > 0)
      filterValues.company_code.forEach((companyCode) => {
        filtersService.push(
          new Filter("company_code", FilterOperator.EQ, companyCode)
        );
      });

    if (filterValues.house_bank_account == undefined) {
    } else if (filterValues.house_bank_account.length > 0)
      filterValues.house_bank_account.forEach((houseBankAccount) => {
        filtersService.push(
          new Filter("house_bank_account", FilterOperator.EQ, houseBankAccount)
        );
      });

    // if (filterValues.bank_account == undefined) {
    // } else if (filterValues.bank_account.length > 0)
    //   filterValues.bank_account.forEach((bankAccount) => {
    //     filtersService.push(
    //       new Filter("bank_account", FilterOperator.EQ, bankAccount)
    //     );
    //   });
    if (filterValues.bank_account_partner == undefined) {
    } else if (filterValues.bank_account_partner.length > 0)
      filterValues.bank_account_partner.forEach((bankAccountPartner) => {
        filtersService.push(
          new Filter(
            "bank_account_partner",
            FilterOperator.EQ,
            bankAccountPartner
          )
        );
      });

    let resultado = await this.odata(
      "/cfw_query_liq_item"
    ).get<Cfw_query_liq_item>({
      filters: filtersService,
      urlParameters: {
        $top: "40000",
      },
    });
    return resultado.data.results;
  }
}
