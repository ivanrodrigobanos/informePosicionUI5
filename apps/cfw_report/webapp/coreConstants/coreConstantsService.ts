import ODataModel from "sap/ui/model/odata/v2/ODataModel";
import BaseService from "./baseService";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import { ConstantsID, ConstantsData } from "./coreConstantsTypes";

type entityReadConstantsResult = {
  results: ConstantsData;
};
export default class CoreConstantsService extends BaseService {
  constructor(oDataModel: ODataModel) {
    super(oDataModel);
  }
  /**
   * Lectura de constantes
   * @param filterValues Filtros de la pantalla principal
   * @returns
   */
  public async readConstants(
    constantsID?: ConstantsID
  ): Promise<ConstantsData> {
    let resultado = await this.odata(
      "/cfw_query_liq_item"
    ).get<entityReadConstantsResult>({
      filters: constantsID ? this.convertConstantsID2Filters(constantsID) : [],
    });
    return resultado.data.results;
  }
  /**
   * Convierte el ID de constantes en filtros para el servicio
   * @param constantsID
   */
  private convertConstantsID2Filters(constantsID: ConstantsID): Filter[] {
    let filters: Filter[] = [];
    filters = constantsID.map((row) => {
      if (row.indexOf("*") !== -1)
        return new Filter("constante", FilterOperator.Contains, row);

      return new Filter("constante", FilterOperator.EQ, row);
    });

    return filters;
  }
}
