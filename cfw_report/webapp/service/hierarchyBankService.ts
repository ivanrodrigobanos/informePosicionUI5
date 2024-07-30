import ODataModel from "sap/ui/model/odata/v2/ODataModel";
import BaseService from "./baseService";
import {
  HierarchyCategory,
  HierarchyID,
  HierarchyNodes,
  ParamsReadHierarchy,
} from "cfwreport/types/hierarchyTypes";
import { HierarchyBanks } from "cfwreport/model/hierarchyBankModel";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";

type Cfw_hier_bankSet = {
  results: HierarchyBanks;
};
export default class HierarchyBankService extends BaseService {
  constructor(oDataModel: ODataModel) {
    super(oDataModel);
  }
  /**
   * Lectura de las jerarquía a partir del ID y categoria de la jerarquía y cuentas
   * @param hierarchy_id ID de jerarquía
   * @param hierarchy_category Tipo de jerarquía
   * @param accounts Cuentas a obtener su jerarquía
   * @param params Parametros para la lectura
   */
  public async readHiearchy(
    hierarchy_id: HierarchyID,
    hierarchy_category: HierarchyCategory,
    accounts: HierarchyNodes,
    params?: ParamsReadHierarchy
  ): Promise<HierarchyBanks> {
    let filtersService: Filter[] = [
      new Filter("hierarchy_id", FilterOperator.EQ, hierarchy_id),
      new Filter("hierarchy_category", FilterOperator.EQ, hierarchy_category),
    ];

    if (params && params.include_noasign)
      filtersService.push(
        new Filter(
          "include_noasign",
          FilterOperator.EQ,
          params.include_noasign ? "X" : ""
        )
      );

    accounts.forEach((item) => {
      filtersService.push(new Filter("node", FilterOperator.EQ, item));
    });

    let resultado = await this.odata("/cfw_hier_bank").get<Cfw_hier_bankSet>({
      filters: filtersService,
    });
    return resultado.data.results;
  }
}
