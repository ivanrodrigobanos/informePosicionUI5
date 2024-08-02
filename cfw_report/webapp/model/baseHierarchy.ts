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
import { Hierarchy, Hierarchys } from "./hierarchyModel";

export default abstract class BaseHierarchy<T> extends Object {
  private busy: boolean;
  protected hierarchyFlat: HierarchysFlat;
  protected hierarchy: Hierarchys;

  constructor() {
    super();
    this.busy = false;
    this.hierarchy = [];
  }
  public setBusy(busy: boolean): void {
    this.busy = busy;
  }

  public abstract getData(): T;
  public abstract clearData(): void;
  /**
   * Determina la criticidad en los nodos en la jerarquía plana
   * @param hierarchyFlat
   */
  public determineCriticNodesHierFlat() {
    this.hierarchyFlat
      .filter(
        (rowHier) =>
          rowHier[FIELDS_TREE.NODE_TYPE] === NODE_TYPES.NODE ||
          rowHier[FIELDS_TREE.NODE_TYPE] === NODE_TYPES.ROOT
      )
      .forEach((rowHier) => {
        let hierIndex = this.hierarchyFlat.findIndex(
          (row) => row[FIELDS_TREE.NODE] === rowHier[FIELDS_TREE.NODE]
        );
        this.getAmountFields(rowHier)
          .filter((rowKey) => rowKey.includes(ENTITY_FIELDS_DATA.AMOUNT_DATA))
          .forEach((rowKey) => {
            let criticField = rowKey.replace(
              ENTITY_FIELDS_DATA.AMOUNT_DATA,
              ENTITY_FIELDS_DATA.AMOUNT_CRITICITY
            );

            this.hierarchyFlat[hierIndex][criticField] =
              Number(this.hierarchyFlat[hierIndex][rowKey]) < 0
                ? CRITICALLY.ERROR
                : CRITICALLY.NEUTRAL;
          });
      });
  }

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
   */
  protected updateAmountParentNodes(
    accountOldValue: HierarchyBankTree,
    accountNewValue: HierarchyBankTree,
    parentNode: string
  ) {
    let hierarchyFlatUpperIndex = this.hierarchyFlat.findIndex(
      (row) => row[FIELDS_TREE.NODE] === parentNode
    );
    if (hierarchyFlatUpperIndex !== -1) {
      this.getAmountFields(accountNewValue)
        .filter((rowKey) => rowKey.includes(ENTITY_FIELDS_DATA.AMOUNT_DATA))
        .forEach((rowKey) => {
          // Primero se resta el valor antiguo al nodo padre
          this.hierarchyFlat[hierarchyFlatUpperIndex][rowKey] =
            Number(this.hierarchyFlat[hierarchyFlatUpperIndex][rowKey]) -
            Number(accountOldValue[rowKey]);

          // se le añade el nuevo valor
          this.hierarchyFlat[hierarchyFlatUpperIndex][rowKey] =
            Number(this.hierarchyFlat[hierarchyFlatUpperIndex][rowKey]) +
            Number(accountNewValue[rowKey]);
        });

      // Se sube al nivel padre
      this.updateAmountParentNodes(
        accountOldValue,
        accountNewValue,
        this.hierarchyFlat[hierarchyFlatUpperIndex][
          FIELDS_TREE.PARENT_NODE
        ] as string
      );
    }
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
  /**
   * Añade y sumariza los registros de los nodos superiores
   * @param hierarchyFlatRow Registro de la jerarquía plana
   */
  protected addSumUpperNodesFlat(hierarchyFlatRow: HierarchyFlat) {
    let hierarchyFlatUpperIndex = this.hierarchyFlat.findIndex(
      (row) =>
        row[FIELDS_TREE.NODE] === hierarchyFlatRow[FIELDS_TREE.PARENT_NODE]
    );
    if (hierarchyFlatUpperIndex === -1)
      hierarchyFlatUpperIndex = this.addUpperNodeFlat(
        hierarchyFlatRow[FIELDS_TREE.PARENT_NODE]
      );

    if (hierarchyFlatUpperIndex !== -1) {
      this.hierarchyFlat[hierarchyFlatUpperIndex][
        FIELDS_TREE_ACCOUNT.CURRENCY
      ] = hierarchyFlatRow[FIELDS_TREE_ACCOUNT.CURRENCY];

      this.getAmountFields(hierarchyFlatRow)
        .filter(
          (rowKey) =>
            rowKey.includes(ENTITY_FIELDS_DATA.AMOUNT_DATA) ||
            rowKey.includes(ENTITY_FIELDS_DATA.AMOUNT_LABEL) ||
            rowKey.includes(ENTITY_FIELDS_DATA.AMOUNT_CRITICITY)
        )
        .forEach((key) => {
          if (key.includes(ENTITY_FIELDS_DATA.AMOUNT_DATA))
            if (this.hierarchyFlat[hierarchyFlatUpperIndex][key])
              this.hierarchyFlat[hierarchyFlatUpperIndex][key] =
                (this.hierarchyFlat[hierarchyFlatUpperIndex][key] as number) +
                (hierarchyFlatRow[key] as number);
            else
              this.hierarchyFlat[hierarchyFlatUpperIndex][key] =
                hierarchyFlatRow[key];
          else
            this.hierarchyFlat[hierarchyFlatUpperIndex][key] =
              hierarchyFlatRow[key];
        });

      // Se vuelve a llamar al método para que sumarize el nodo padre
      this.addSumUpperNodesFlat(this.hierarchyFlat[hierarchyFlatUpperIndex]);
    }
  }
  /**Añade el nodo superior a la jerarquía plana */
  protected addUpperNodeFlat(parent_node: string | number): number {
    let hierarchyData = this.hierarchy.find(
      (rowHier: any) => rowHier[FIELDS_TREE.NODE] === parent_node
    ) as Hierarchy;

    if (!hierarchyData) return -1;

    let newRow: HierarchyFlat = {};
    Polyfill.ObjectKeys(hierarchyData).forEach((key) => {
      newRow[key] = hierarchyData[key as keyof Hierarchy];
    });
    this.hierarchyFlat.push(newRow);

    // se devuelve el indice del registro insertado
    return this.hierarchyFlat.findIndex((row) => row.node === parent_node);
  }
  /**
   * Ordenacion para que quede los niveles de arriba abajo. Y dentro del mismo nivel que se vean de mayor a menor segun
   * su orden de visualización
   * @param hierarchy
   * @returns
   */
  protected _sortHierarchyFlat(hierarchy: HierarchysFlat): HierarchysFlat {
    return hierarchy.sort((a, b) => {
      if (
        (a[FIELDS_TREE.NODE_LEVEL] as number) <
        (b[FIELDS_TREE.NODE_LEVEL] as number)
      ) {
        return -1;
      } else if (
        (a[FIELDS_TREE.NODE_LEVEL] as number) ===
        (b[FIELDS_TREE.NODE_LEVEL] as number)
      ) {
        if (
          (a[FIELDS_TREE.NODE_DISPLAY_ORDER] as number) >
          (b[FIELDS_TREE.NODE_DISPLAY_ORDER] as number)
        )
          return -1;
        else if (
          (a[FIELDS_TREE.NODE_DISPLAY_ORDER] as number) <
          (b[FIELDS_TREE.NODE_DISPLAY_ORDER] as number)
        )
          return 1;
        else return 0;
      } else {
        return 1;
      }
    });
  }
}
