import ODataModel from "sap/ui/model/odata/v2/ODataModel";
import BaseState from "./baseState";
import CoreConstantsModel from "./coreConstantsModel";
import CoreConstantsService from "./coreConstantsService";
import { ConstantID, ConstantsID, ConstantValues } from "./coreConstantsTypes";

export type ConstantData = {
  constants: CoreConstantsModel;
};

export default class CoreConstantsState extends BaseState<
  CoreConstantsService,
  ConstantData
> {
  constructor(ODataModel: ODataModel) {
    super(new CoreConstantsService(ODataModel));
    this.data = {
      constants: new CoreConstantsModel(),
    };
  }
  /**
   * Lectura de constantes
   * @param constantsID
   */
  async readConstants(constantsID?: ConstantsID) {
    let values = await this.service.readConstants(constantsID);
    this.getData().constants = new CoreConstantsModel(values);
    this.updateModel();
  }
  /**
   * Devuelve los valores de una constante
   * @returns
   */
  public getConstantValues(constant: ConstantID): ConstantValues {
    return this.getData().constants.getConstantValues(constant);
  }
  /**
   * Devuelve los valores a partir de un patron de constantes
   * @returns
   */
  public getConstantPatternValues(constant: ConstantID): ConstantValues {
    return this.getData().constants.getConstantPatternValues(constant);
  }
}
