import BaseHierarchy from "./baseHierarchy";
import ResourceBundle from "sap/base/i18n/ResourceBundle";
import {
  HierarchyFlat,
  HierarchysFlat,
  HierarchyTree,
} from "liqreport/types/types";
import { Hierarchy, Hierarchys } from "./hierarchyModel";
import { AccountData, AccountsData } from "liqreport/types/liquidityItemTypes";
import {
  FIELDS_TREE,
  FIELDS_TREE_LIQITEM,
  NODE_NOASIGN,
  NODE_TYPES,
  FIELDS_TREE_INTERNAL,
} from "liqreport/constants/treeConstants";

export default class HierarchyLiqItemAccountModel extends BaseHierarchy<HierarchyTree> {
  private hierarchyTree: HierarchyTree;
  private accountData: AccountsData;
  private LiqItemWOHier: AccountsData;

  constructor(
    i18nBundle: ResourceBundle,
    hierarchyLiqItem?: Hierarchys,
    accountData?: AccountsData
  ) {
    super();
    this.hierarchyFlat = [];
    this.hierarchyTree = [];
    this.setI18nBundle(i18nBundle);

    if (hierarchyLiqItem && accountData) {
      this.hierarchy = hierarchyLiqItem;
      this.accountData = accountData;
      this.buildHierarchyFlat();
      // La criticidad en nodos superiores se determina una vez se ha montado toda la jerarquía y los totales
      // están calculados
      this.determineCriticNodesHierFlat();
      this.hierarchyTree = this._buildHierarchyTree();
    }
  }
  public getFlatData(): HierarchysFlat {
    return this.hierarchyFlat;
  }
  public getData(): HierarchyTree {
    return this.hierarchyTree;
  }
  public clearData(): void {
    this.hierarchyFlat = [];
    this.hierarchyTree = [];
  }
  /**
   * Construye la jerarquía en formato plano
   */
  private buildHierarchyFlat() {
    this.hierarchyFlat = [];
    this.LiqItemWOHier = [];
    this.nodesToSumUpper = [];

    this.accountData
      // .filter((row) => row.source === SOURCE_TYPES.SALDO_FIN)
      .forEach((row) => {
        let hierarchyFlatRow = this.hierarchyFlat.find(
          (rowHierFlat) => rowHierFlat.node === row.liquidity_item
        );

        // Añade los datos de la cuenta a la jerarquía plana y nos devuelve el indice donde se ha insertado
        if (!hierarchyFlatRow)
          hierarchyFlatRow = this.addAccountHierarchyFlat(
            row,
            this.hierarchyFlat
          );

        if (hierarchyFlatRow) this.addUpperNodesFlat(hierarchyFlatRow);
      });

    // Se añaden las posiciones de liquidez que no tienen nodo
    if (this.LiqItemWOHier.length > 0)
      this.addLiqItemWONode(this.hierarchyFlat);

    // Ordenacion para que quede los niveles de arriba abajo. Y dentro del mismo nivel que se vean de mayor a menor segun
    // su orden de visualización
    this.hierarchyFlat = this._sortHierarchyFlat(this.hierarchyFlat);

    // Sumariza los nodos de abajo arriba
    this.sumNodesDownUpperHierFlat();
  }
  /**
   * Construye la jerarquía en formato arbol, nodos anidados, a partir de
   * la jerarquía plana.
   * @returns Jerarquía en formato arbol
   */
  private _buildHierarchyTree(): HierarchyTree {
    let hierarchyTree: HierarchyTree = {};

    if (this.hierarchyFlat.length === 0) return hierarchyTree;

    // El primer nivel es el registro 0 de la jerarquía plana
    let rowTree: HierarchyTree = {};
    rowTree = this.fillTreeAmountData(rowTree, this.hierarchyFlat[0]); // Campos de importe y etiquetas
    this.fillTreeNodeField(rowTree, this.hierarchyFlat[0]); // Nombre del nodo

    // Rellena los nodos inferiores
    this.fillTreeSubnodes(rowTree, this.hierarchyFlat[0].node);

    hierarchyTree[FIELDS_TREE_INTERNAL.CHILD_NODE] = [rowTree];

    return hierarchyTree;
  }
  /**
   * Añade el registro de la cuenta y nivel de jerarquía
   * @param LiqItemData
   * @param hierarchyFlat
   */
  private addAccountHierarchyFlat(
    LiqItemData: AccountData,
    hierarchyFlat: HierarchysFlat
  ): HierarchyFlat | undefined {
    let hierarchyData = this.hierarchy.find(
      (rowHier: any) => rowHier[FIELDS_TREE.NODE] === LiqItemData.liquidity_item
    ) as Hierarchy;
    // Si no existe la guardo en una array de posiciones sin nodo para luego añadirlas en un nodo de no asignados
    if (!hierarchyData) {
      this.LiqItemWOHier.push(LiqItemData);
      return undefined; // Devuelve indefinido para que la cuenta sea procesada posteriormente
    }

    // Pasamos los datos de la jeraquía
    let newRow: HierarchyFlat = {};
    Object.keys(hierarchyData).forEach((key) => {
      newRow[key] = hierarchyData[key as keyof Hierarchy];
    });
    // Pasamos los datos de la cuenta
    newRow = this.fillAccountDataInRowHierFlat(LiqItemData, newRow);

    hierarchyFlat.push(newRow);

    // Devuelve la posición insertada
    return newRow;
  }
  /**
   * Informa los campos de la cuenta en un registro de jerarquía plana
   * @param accountData
   * @param hierarchyFlat
   */
  private fillAccountDataInRowHierFlat(
    accountData: AccountData,
    hierarchyFlat: HierarchyFlat
  ): HierarchyFlat {
    let newRow = structuredClone(hierarchyFlat);

    Object.keys(accountData).forEach((key) => {
      newRow[key] = accountData[key as keyof AccountData];
    });

    return newRow;
  }
  /**
   * Aañade las posiciones que no tienen nodo
   */
  private addLiqItemWONode(hierarchyFlat: HierarchysFlat) {
    // Se toma el nodo root como base para construir el no asignados.
    let rootNode = structuredClone(
      this.hierarchy.find((row) => row.node_type === NODE_TYPES.ROOT)
    );
    if (!rootNode) return;
    let nodeNoAsign: HierarchyFlat = { ...rootNode };
    nodeNoAsign[FIELDS_TREE.NODE] = NODE_NOASIGN;
    nodeNoAsign[FIELDS_TREE.NODE_NAME] = this.getI18nBundle().getText(
      "liqItemAccountTree.nodeNoAsign"
    ) as string;
    nodeNoAsign[FIELDS_TREE.PARENT_NODE] = rootNode.node;
    nodeNoAsign[FIELDS_TREE.NODE_LEVEL] = rootNode.node_level + 1;
    nodeNoAsign[FIELDS_TREE.NODE_LEVEL] = NODE_TYPES.LEAF;
    nodeNoAsign[FIELDS_TREE.NODE_DISPLAY_ORDER] = Number(
      `${nodeNoAsign.node_level}.1`
    );
    this.hierarchyFlat.push(nodeNoAsign);

    this.LiqItemWOHier.forEach((liqItemData: AccountData, index) => {
      // Pasamos los datos de la jeraquía
      let newRow: HierarchyFlat = {};
      newRow[FIELDS_TREE.NODE] =
        liqItemData[FIELDS_TREE_LIQITEM.LIQUIDITY_ITEM];
      newRow[FIELDS_TREE.NODE_NAME] =
        liqItemData[FIELDS_TREE_LIQITEM.LIQUIDITY_ITEM_NAME];
      newRow[FIELDS_TREE.PARENT_NODE] = nodeNoAsign[FIELDS_TREE.NODE];
      newRow[FIELDS_TREE.NODE_LEVEL] =
        (nodeNoAsign[FIELDS_TREE.NODE_LEVEL] as number) + 1;
      newRow[FIELDS_TREE.NODE_TYPE] = NODE_TYPES.LEAF;
      newRow[FIELDS_TREE.NODE_DISPLAY_ORDER] = Number(
        `${nodeNoAsign.node_level}.1${index}`
      );

      // Pasamos los datos de la cuenta
      newRow = this.fillAccountDataInRowHierFlat(liqItemData, newRow);

      hierarchyFlat.push(newRow);

      this.addUpperNodesFlat(newRow); // Sumariza los nodos superiores
    });
  }

  /**
   * Rellena los nodos inferiores de la jerarquía
   * @param parentRowTree fila del nodo superior
   * @param parentNode Nodo superior
   */
  private fillTreeSubnodes(
    parentRowTree: HierarchyTree,
    parentNode: string | number
  ) {
    let rowTreeArray: Array<HierarchyTree> = [];
    // Si el nodo padre no tiene nodo inferior ni continuamos.
    if (
      this.hierarchyFlat.findIndex(
        (rowFlat) => rowFlat[FIELDS_TREE.PARENT_NODE] === parentNode
      ) !== -1
    ) {
      this.hierarchyFlat
        .filter((rowFlat) => rowFlat[FIELDS_TREE.PARENT_NODE] === parentNode)
        .forEach((rowFlat) => {
          let rowTree: HierarchyTree = {};

          this.fillTreeNodeField(rowTree, rowFlat); // Nombre del nodo
          this.fillTreeAmountData(rowTree, rowFlat); // Campos de importe y etiquetas

          // El tipo nodo L es el nodo de cuenta y puede tener niveles de tesoreria. El tipo de nodo de cuenta
          // se trata de una manera distinta, y dentro de ella si hay niveles de tesoreria se volverá a llamar al mismo método.
          if (rowFlat[FIELDS_TREE.NODE_TYPE] === NODE_TYPES.LEAF)
            this.fillTreeAccountData(rowTree, rowFlat);
          else this.fillTreeSubnodes(rowTree, rowFlat[FIELDS_TREE.NODE]);

          rowTreeArray.push(rowTree);
        });

      parentRowTree[FIELDS_TREE_INTERNAL.CHILD_NODE] = rowTreeArray;
    }
  }
  /**
   * Informa los campos de la cuenta bancaria al registro del nodo
   * @param rowTree Registro del tree table
   * @param rowHierarchyFlat registro de la jerarquía plana
   */
  private fillTreeAccountData(
    rowTree: HierarchyTree,
    rowHierarchyFlat: HierarchyFlat
  ) {
    // Hago esta ñapa para pasar solo los campos que son de la cuenta.
    Object.keys(this.accountData[0]).forEach((key) => {
      rowTree[key] = rowHierarchyFlat[key as keyof AccountData];
    });
  }
}
