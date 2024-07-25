import Object from "sap/ui/base/Object";
import { HierarchyBankTree } from "./hierarchyBankAccountModel";
import { HierarchyFlat } from "cfwreport/types/types";
import Polyfill from "cfwreport/utils/polyfill";
import { ENTITY_FIELDS_DATA } from "cfwreport/constants/smartConstants";
import { FIELDS_TREE_ACCOUNT } from "cfwreport/constants/treeConstants";

export default abstract class BaseHierarchy<T> extends Object {
  private busy: boolean;
  constructor() {
    super();
    this.busy = false;
  }
  public setBusy(busy: boolean): void {
    this.busy = busy;
  }

  /**
   * Rellena los campos de importe y cabecera que tendrá el importe del registro de la jerarquía plana a la del arbol
   * @param rowTree Registro del tree table
   * @param rowHierarchyFlat registro de la jerarquía plana
   */
  protected fillTreeAmountData(
    rowTree: HierarchyBankTree,
    rowHierarchyFlat: HierarchyFlat
  ) {
    Polyfill.ObjectKeys(rowHierarchyFlat)
      .filter(
        (rowKey) =>
          rowKey.includes(ENTITY_FIELDS_DATA.AMOUNT_DATA) ||
          rowKey.includes(ENTITY_FIELDS_DATA.AMOUNT_LABEL) ||
          rowKey.includes(ENTITY_FIELDS_DATA.AMOUNT_CRITICITY)
      )
      .forEach((key) => {
        rowTree[key] = rowHierarchyFlat[key];
      });
    rowTree[FIELDS_TREE_ACCOUNT.CURRENCY] =
      rowHierarchyFlat[FIELDS_TREE_ACCOUNT.CURRENCY];
  }

  public abstract getData(): T;
  public abstract clearData(): void;
}
