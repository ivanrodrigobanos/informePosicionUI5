import { CRITICALLY } from "cfwreport/constants/treeConstants";
import { ValueState } from "sap/ui/core/library";

export default class Conversion {
  /**
   * Convierte la criticidad de las anotaciones del CDS al ValueState de UI5
   * @param criticality Criticidad del CDS
   * @returns Criticidad en formato ValueState
   */
  static criticallyToValueState(criticality: number): ValueState {
    if (criticality === CRITICALLY.SUCCES) return ValueState.Success;
    if (criticality === CRITICALLY.WARNING) return ValueState.Warning;
    if (criticality === CRITICALLY.ERROR) return ValueState.Error;
    if (criticality === CRITICALLY.INFORMATION) return ValueState.Information;
    return ValueState.None;
  }
}
