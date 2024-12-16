import ODataModel from "sap/ui/model/odata/v2/ODataModel";
import BaseService from "./baseService";
import { HierarchyID } from "liqreport/types/hierarchyTypes";
import { Hierarchys } from "liqreport/model/hierarchyModel";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";

type Cfw_hierarchySet = {
  results: Hierarchys;
};
export default class HierarchyLiqItemService extends BaseService {
  constructor(oDataModel: ODataModel) {
    super(oDataModel);
  }
  /**
   * Lectura de las jerarquía a partir del ID y categoria de la jerarquía y cuentas
   * @param hierarchy_id ID de jerarquía
   * @param hierarchy_category Tipo de jerarquía
   * @param params Parametros para la lectura
   */
  public async readHiearchy(hierarchy_id: HierarchyID): Promise<Hierarchys> {
    let filtersService: Filter[] = [
      new Filter("hierarchy_id", FilterOperator.EQ, hierarchy_id),
    ];

    let resultado = await this.odata(
      "/cfw_hier_liq_item"
    ).get<Cfw_hierarchySet>({
      filters: filtersService,
    });
    return resultado.data.results;
  }
}
