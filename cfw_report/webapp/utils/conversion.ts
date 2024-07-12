import { ValueState } from "sap/ui/core/library";

export default class Conversion {
  /**
   * Convierte la criticidad de las anotaciones del CDS al ValueState de UI5
   * @param criticality Criticidad del CDS
   * @returns Criticidad en formato ValueState
   */
  static criticallyToValueState(criticality: number): ValueState {
    if (criticality === 3) return ValueState.Success;
    if (criticality === 2) return ValueState.Warning;
    if (criticality === 1) return ValueState.Error;
    if (criticality === 5) return ValueState.Information;
    return ValueState.None;
  }
}
