import BaseModel from "./baseModel";
import {
  ConstantID,
  ConstantsData,
  ConstantValues,
} from "./coreConstantsTypes";

export default class CoreConstantsModel extends BaseModel<ConstantsData> {
  private constantsValue: ConstantsData;

  constructor(data?: ConstantsData) {
    super();
    this.constantsValue = [];

    if (data) this.constantsValue = data;
  }
  public getData(): ConstantsData {
    return this.constantsValue;
  }
  public clearData(): void {
    this.constantsValue = [];
  }
  /**
   * Devuelve los valores de una constante
   * @returns
   */
  public getConstantValues(constant: ConstantID): ConstantValues {
    let values: ConstantValues = [];

    values = this.constantsValue
      .filter((row) => row.Constante === constant)
      .map((row) => row.Valor);

    return values;
  }
  /**
   * Devuelve los valores a partir de un patron de constantes
   * @returns
   */
  public getConstantPatternValues(constant: ConstantID): ConstantValues {
    let values: ConstantValues = [];

    values = this.constantsValue
      .filter((row) => row.Constante.includes(constant))
      .map((row) => row.Valor);

    return values;
  }
}
