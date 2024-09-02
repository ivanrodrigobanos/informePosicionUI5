import Object from "sap/ui/base/Object";
import {
  HierarchyFlat,
  HierarchyTree,
  HierarchysFlat,
} from "cfwreport/types/types";
import Polyfill from "cfwreport/utils/polyfill";
import { ENTITY_FIELDS_DATA } from "cfwreport/constants/smartConstants";
import {
  CRITICALLY,
  FIELDS_TREE,
  FIELDS_TREE_ACCOUNT,
  FIELDS_TREE_INTERNAL,
  NODE_TYPES,
} from "cfwreport/constants/treeConstants";
import { AccountData } from "cfwreport/types/accountBankTypes";
import { Hierarchy, Hierarchys } from "./hierarchyModel";
import ResourceBundle from "sap/base/i18n/ResourceBundle";
import { HierarchyNodes } from "cfwreport/types/hierarchyTypes";

export default abstract class BaseHierarchy<T> extends Object {
  private busy: boolean;
  protected hierarchyFlat: HierarchysFlat;
  protected hierarchy: Hierarchys;
  protected i18nBundle: ResourceBundle;
  protected nodesToSumUpper: HierarchyNodes = [];

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
            let criticField = this.getCriticFieldFromAmount(rowKey);
            this.hierarchyFlat[hierIndex][criticField] =
              this.getCriticallyFromAmount(
                Number(this.hierarchyFlat[hierIndex][rowKey])
              );
          });

        // Campo overdue
        this.hierarchyFlat[hierIndex][FIELDS_TREE_ACCOUNT.OVERDUE_CRITIC] =
          this.getCriticallyFromAmount(
            Number(
              this.hierarchyFlat[hierIndex][FIELDS_TREE_ACCOUNT.OVERDUE_AMOUNT]
            )
          );
      });
  }

  /**
   * Rellena los campos de importe y cabecera que tendrá el importe del registro de la jerarquía plana a la del arbol
   * @param rowTree Registro del tree table
   * @param rowHierarchyFlat registro de la jerarquía plana
   */
  protected fillTreeAmountData(
    rowTree: HierarchyTree,
    rowHierarchyFlat: HierarchyFlat
  ): HierarchyTree {
    this.getAmountFields(rowHierarchyFlat).forEach((key) => {
      rowTree[key] = rowHierarchyFlat[key];
    });
    rowTree[FIELDS_TREE_ACCOUNT.CURRENCY] =
      rowHierarchyFlat[FIELDS_TREE_ACCOUNT.CURRENCY];

    // Campos overdue
    rowTree[FIELDS_TREE_ACCOUNT.OVERDUE_AMOUNT] =
      rowHierarchyFlat[FIELDS_TREE_ACCOUNT.OVERDUE_AMOUNT];
    rowTree[FIELDS_TREE_ACCOUNT.OVERDUE_CRITIC] =
      rowHierarchyFlat[FIELDS_TREE_ACCOUNT.OVERDUE_CRITIC];

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
    accountOldValue: HierarchyTree,
    accountNewValue: HierarchyTree,
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
   * Añade  los registros de los nodos superiores
   * @param hierarchyFlatRow Registro de la jerarquía plana
   */
  protected addUpperNodesFlat(hierarchyFlatRow: HierarchyFlat) {
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
          if (key.includes(ENTITY_FIELDS_DATA.AMOUNT_DATA)) {
            if (!this.hierarchyFlat[hierarchyFlatUpperIndex][key])
              this.hierarchyFlat[hierarchyFlatUpperIndex][key] = 0; // El importe se inicializa a 0}

            // Si el registro de donde viene es una cuenta/posicion/lo que sea sumarizo el nodo porque lo va hacer correctamente.
            if (hierarchyFlatRow[FIELDS_TREE.NODE_TYPE] === NODE_TYPES.LEAF)
              this.hierarchyFlat[hierarchyFlatUpperIndex][key] =
                (this.hierarchyFlat[hierarchyFlatUpperIndex][key] as number) +
                (hierarchyFlatRow[key] as number);
          } else {
            this.hierarchyFlat[hierarchyFlatUpperIndex][key] =
              hierarchyFlatRow[key];
          }
        });

      // Campos overdue
      // Importe
      if (
        !this.hierarchyFlat[hierarchyFlatUpperIndex][
          FIELDS_TREE_ACCOUNT.OVERDUE_AMOUNT
        ]
      )
        this.hierarchyFlat[hierarchyFlatUpperIndex][
          FIELDS_TREE_ACCOUNT.OVERDUE_AMOUNT
        ] = 0;

      // Si el registro de donde viene es una cuenta/posicion/lo que sea sumarizo el nodo porque lo va hacer correctamente
      if (hierarchyFlatRow[FIELDS_TREE.NODE_TYPE] === NODE_TYPES.LEAF)
        this.hierarchyFlat[hierarchyFlatUpperIndex][
          FIELDS_TREE_ACCOUNT.OVERDUE_AMOUNT
        ] =
          (this.hierarchyFlat[hierarchyFlatUpperIndex][
            FIELDS_TREE_ACCOUNT.OVERDUE_AMOUNT
          ] as number) +
          (hierarchyFlatRow[FIELDS_TREE_ACCOUNT.OVERDUE_AMOUNT] as number);

      // Criticidad. Pongo el valor si no existe, porque luego se recalcula
      if (
        !this.hierarchyFlat[hierarchyFlatUpperIndex][
          FIELDS_TREE_ACCOUNT.OVERDUE_CRITIC
        ]
      )
        this.hierarchyFlat[hierarchyFlatUpperIndex][
          FIELDS_TREE_ACCOUNT.OVERDUE_CRITIC
        ] = hierarchyFlatRow[FIELDS_TREE_ACCOUNT.OVERDUE_CRITIC];

      // Se vuelve a llamar al método para que sumarize el nodo padre
      this.addUpperNodesFlat(this.hierarchyFlat[hierarchyFlatUpperIndex]);
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
          (a[FIELDS_TREE.NODE_DISPLAY_ORDER] as number) <
          (b[FIELDS_TREE.NODE_DISPLAY_ORDER] as number)
        )
          return -1;
        else if (
          (a[FIELDS_TREE.NODE_DISPLAY_ORDER] as number) >
          (b[FIELDS_TREE.NODE_DISPLAY_ORDER] as number)
        )
          return 1;
        else return 0;
      } else {
        return 1;
      }
    });
  }
  /**
   * Rellena el campo del valor del nodo
   * @param rowTree Registro del tree table
   * @param rowHierarchyFlat registro de la jerarquía plana
   */
  protected fillTreeNodeField(
    rowTree: HierarchyTree,
    rowHierarchyFlat: HierarchyFlat
  ) {
    rowTree[FIELDS_TREE.NODE] = rowHierarchyFlat[FIELDS_TREE.NODE];
    rowTree[FIELDS_TREE.NODE_NAME] = rowHierarchyFlat[FIELDS_TREE.NODE_NAME];

    // Aprovecho para añadir dos campos especificos que se usarán en path de componentes para inicializalos.
    // Alguno de ellos cuando se esta en el nodo de cuenta se cambiará su valor en caso necesario
    rowTree[FIELDS_TREE_INTERNAL.SHOW_BTN_PLV] = false;
    rowTree[FIELDS_TREE_INTERNAL.LOADING_VALUES] = false;
  }
  /**
   * Informa el objeto que permite sacar los textos i18n
   * @param i18nBundle
   */
  protected setI18nBundle(i18nBundle: ResourceBundle) {
    this.i18nBundle = i18nBundle;
  }
  /**
   * Devuelve el objeto que permite sacar los textos i18n
   * @returns
   */
  protected getI18nBundle(): ResourceBundle {
    return this.i18nBundle;
  }
  /**
   * Devuelve la criticidad para un importe
   * @param amount
   * @returns
   */
  protected getCriticallyFromAmount(amount: number): number {
    return amount < 0 ? CRITICALLY.ERROR : CRITICALLY.NEUTRAL;
  }
  /**
   * Devuelve el campo de criticidad a partir del campo de importe
   * @param amountField
   * @returns
   */
  protected getCriticFieldFromAmount(amountField: string): string {
    return amountField.replace(
      ENTITY_FIELDS_DATA.AMOUNT_DATA,
      ENTITY_FIELDS_DATA.AMOUNT_CRITICITY
    );
  }
  /**
   * Sumariza los nodos de abajo arriba empezando por el nodo raiz.
   */
  protected sumNodesDownUpperHierFlat() {
    let rowRoot = this.hierarchyFlat.find(
      (row) => row[FIELDS_TREE.NODE_TYPE] === NODE_TYPES.ROOT
    );
    if (rowRoot) {
      this.sumUpperNodesHierFlat(rowRoot[FIELDS_TREE.NODE] as string);
    }

    //
  }
  private sumUpperNodesHierFlat(node: string) {
    // Vamos a sumarizar de abajo hacia arriba.
    this.hierarchyFlat
      .filter(
        (row) =>
          row[FIELDS_TREE.PARENT_NODE] === node &&
          row[FIELDS_TREE.NODE_TYPE] === NODE_TYPES.NODE
      )
      .forEach((row) => {
        this.sumUpperNodesHierFlat(row[FIELDS_TREE.NODE] as string);
      });
    let indexNode = this.hierarchyFlat.findIndex(
      (row) =>
        row[FIELDS_TREE.NODE] === node &&
        row[FIELDS_TREE.NODE_TYPE] === NODE_TYPES.NODE
    );
    if (indexNode === -1) return;
    let indexParentNode = this.hierarchyFlat.findIndex(
      (row) =>
        row[FIELDS_TREE.NODE] ===
          this.hierarchyFlat[indexNode][FIELDS_TREE.PARENT_NODE] &&
        (row[FIELDS_TREE.NODE_TYPE] === NODE_TYPES.NODE ||
          row[FIELDS_TREE.NODE_TYPE] === NODE_TYPES.ROOT)
    );
    if (indexParentNode === -1) return;

    // Campos normales
    this.getAmountFields(this.hierarchyFlat[indexNode])
      .filter((rowKey) => rowKey.includes(ENTITY_FIELDS_DATA.AMOUNT_DATA))
      .forEach((key) => {
        this.hierarchyFlat[indexParentNode][key] =
          (this.hierarchyFlat[indexParentNode][key] as number) +
          (this.hierarchyFlat[indexNode][key] as number);
      });

    // Campo overdue
    this.hierarchyFlat[indexParentNode][FIELDS_TREE_ACCOUNT.OVERDUE_AMOUNT] =
      (this.hierarchyFlat[indexParentNode][
        FIELDS_TREE_ACCOUNT.OVERDUE_AMOUNT
      ] as number) +
      (this.hierarchyFlat[indexNode][
        FIELDS_TREE_ACCOUNT.OVERDUE_AMOUNT
      ] as number);
  }
}
