import Object from "sap/ui/base/Object";
import { HierarchyBankTree } from "./hierarchyBankAccountModel";
import { HierarchyFlat, HierarchysFlat } from "cfwreport/types/types";
import Polyfill from "cfwreport/utils/polyfill";
import { ENTITY_FIELDS_DATA } from "cfwreport/constants/smartConstants";
import {
  CRITICALLY,
  FIELDS_TREE,
  FIELDS_TREE_ACCOUNT,
  NODE_TYPES,
} from "cfwreport/constants/treeConstants";
import { AccountData } from "cfwreport/types/accountBankTypes";

export default abstract class BaseHierarchy<T> extends Object {
  private busy: boolean;
  constructor() {
    super();
    this.busy = false;
  }
  public setBusy(busy: boolean): void {
    this.busy = busy;
  }

  public abstract getData(): T;
  public abstract clearData(): void;
  /**
   * Rellena los campos de importe y cabecera que tendrá el importe del registro de la jerarquía plana a la del arbol
   * @param rowTree Registro del tree table
   * @param rowHierarchyFlat registro de la jerarquía plana
   */
  protected fillTreeAmountData(
    rowTree: HierarchyBankTree,
    rowHierarchyFlat: HierarchyFlat
  ): HierarchyBankTree {
    this.getAmountFields(rowHierarchyFlat).forEach((key) => {
      rowTree[key] = rowHierarchyFlat[key];
    });
    rowTree[FIELDS_TREE_ACCOUNT.CURRENCY] =
      rowHierarchyFlat[FIELDS_TREE_ACCOUNT.CURRENCY];

    return rowTree;
  }
  /**
   * Rellena los importe en el registro de una jerarquía plana a partir de los datos de cuenta
   * @param rowHierarchyFlat
   * @param accountData
   */
  protected fillAmountData(
    rowFlat: HierarchyFlat,
    accountData: AccountData
  ): HierarchyFlat {
    this.getAmountFields(accountData).forEach((key) => {
      rowFlat[key] = accountData[key];
    });
    rowFlat[FIELDS_TREE_ACCOUNT.CURRENCY] =
      accountData[FIELDS_TREE_ACCOUNT.CURRENCY];

    return rowFlat;
  }
  /**
   * Actualiza los importe de los nodos padre
   * @param accountOldValue Importe original que se tiene que restar al nodo padre
   * @param accountNewValue Nuevo importe que se sumará al nodo padre
   * @param parentNode Id del nodo padre
   * @param hierarchyFlat Jerarquía plana
   */
  protected updateAmountParentNodes(
    accountOldValue: HierarchyBankTree,
    accountNewValue: HierarchyBankTree,
    parentNode: string,
    hierarchyFlat: HierarchysFlat
  ) {
    let hierarchyFlatUpperIndex = hierarchyFlat.findIndex(
      (row) => row[FIELDS_TREE.NODE] === parentNode
    );
    if (hierarchyFlatUpperIndex !== -1) {
      this.getAmountFields(accountNewValue)
        .filter((rowKey) => rowKey.includes(ENTITY_FIELDS_DATA.AMOUNT_DATA))
        .forEach((rowKey) => {
          // Primero se resta el valor antiguo al nodo padre
          hierarchyFlat[hierarchyFlatUpperIndex][rowKey] =
            Number(hierarchyFlat[hierarchyFlatUpperIndex][rowKey]) -
            Number(accountOldValue[rowKey]);

          // se le añade el nuevo valor
          hierarchyFlat[hierarchyFlatUpperIndex][rowKey] =
            Number(hierarchyFlat[hierarchyFlatUpperIndex][rowKey]) +
            Number(accountNewValue[rowKey]);
        });

      // Se sube al nivel padre
      this.updateAmountParentNodes(
        accountOldValue,
        accountNewValue,
        hierarchyFlat[hierarchyFlatUpperIndex][
          FIELDS_TREE.PARENT_NODE
        ] as string,
        hierarchyFlat
      );
    }
  }
  /**
   * Determina la criticidad en los nodos en la jerarquía plana
   * @param hierarchyFlat
   */
  protected determineCriticNodesHierFlat(
    hierarchyFlat: HierarchysFlat
  ): HierarchysFlat {
    let newHierarchy = [...hierarchyFlat];

    hierarchyFlat
      .filter(
        (rowHier) =>
          rowHier[FIELDS_TREE.NODE_TYPE] === NODE_TYPES.NODE ||
          rowHier[FIELDS_TREE.NODE_TYPE] === NODE_TYPES.ROOT
      )
      .forEach((rowHier) => {
        let hierIndex = hierarchyFlat.findIndex(
          (row) => row[FIELDS_TREE.NODE] === rowHier[FIELDS_TREE.NODE]
        );
        this.getAmountFields(rowHier)
          .filter((rowKey) => rowKey.includes(ENTITY_FIELDS_DATA.AMOUNT_DATA))
          .forEach((rowKey) => {
            let criticField = rowKey.replace(
              ENTITY_FIELDS_DATA.AMOUNT_DATA,
              ENTITY_FIELDS_DATA.AMOUNT_CRITICITY
            );

            newHierarchy[hierIndex][criticField] =
              Number(newHierarchy[hierIndex][rowKey]) < 0
                ? CRITICALLY.ERROR
                : CRITICALLY.NEUTRAL;
          });
      });

    return newHierarchy;
  }

  /**
   * Devuelve los campos relacionados con los importe de un registro
   * @param row
   * @returns
   */
  protected getAmountFields(row: object): string[] {
    return Polyfill.ObjectKeys(row).filter(
      (rowKey) =>
        rowKey.includes(ENTITY_FIELDS_DATA.AMOUNT_DATA) ||
        rowKey.includes(ENTITY_FIELDS_DATA.AMOUNT_LABEL) ||
        rowKey.includes(ENTITY_FIELDS_DATA.AMOUNT_CRITICITY)
    );
  }
}
