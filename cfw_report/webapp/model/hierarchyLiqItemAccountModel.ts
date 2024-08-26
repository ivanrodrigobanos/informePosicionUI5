import BaseHierarchy from "./baseHierarchy";
import {
  HierarchyFlat,
  HierarchysFlat,
  HierarchyTree,
} from "cfwreport/types/types";
import { Hierarchy, Hierarchys } from "./hierarchyModel";
import { AccountData, AccountsData } from "cfwreport/types/liquidityItemTypes";
import {
  FIELDS_TREE,
  NODE_NOASIGN,
  NODE_TYPES,
} from "cfwreport/constants/treeConstants";

export type HierarchyLiqItemTree = HierarchyTree;

export default class HierarchyLiqItemAccountModel extends BaseHierarchy<HierarchyLiqItemTree> {
  private hierarchyTree: HierarchyLiqItemTree;
  private accountData: AccountsData;
  private LiqItemWOHier: AccountsData;

  constructor(hierarchyBank?: Hierarchys, accountData?: AccountsData) {
    super();
    this.hierarchyFlat = [];
    this.hierarchyTree = [];

    if (hierarchyBank && accountData) {
      this.hierarchy = hierarchyBank;
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
  public getData(): HierarchyLiqItemTree {
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

        if (hierarchyFlatRow) this.addSumUpperNodesFlat(hierarchyFlatRow);
      });

    // Se añaden las posiciones de liquidez que no tienen nodo
    if (this.LiqItemWOHier.length > 0) this.addLiqItemWONode();

    // Ordenacion para que quede los niveles de arriba abajo. Y dentro del mismo nivel que se vean de mayor a menor segun
    // su orden de visualización
    this.hierarchyFlat = this._sortHierarchyFlat(this.hierarchyFlat);
  }
  /**
   * Construye la jerarquía en formato arbol, nodos anidados, a partir de
   * la jerarquía plana.
   * @returns Jerarquía en formato arbol
   */
  private _buildHierarchyTree(): HierarchyLiqItemTree {
    let hierarchyTree: HierarchyLiqItemTree = {};

    if (this.hierarchyFlat.length === 0) return hierarchyTree;

    // El primer nivel es el registro 0 de la jerarquía plana
    let rowTree: HierarchyLiqItemTree = {};
    rowTree = this.fillTreeAmountData(rowTree, this.hierarchyFlat[0]); // Campos de importe y etiquetas
    this.fillTreeNodeField(rowTree, this.hierarchyFlat[0]); // Nombre del nodo

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
  private addLiqItemWONode() {
    // Se toma el nodo root como base para construir el no asignados.
    let rootNode = structuredClone(
      this.hierarchy.find((row) => row.node_type === NODE_TYPES.ROOT)
    );
    if (!rootNode) return;
    let nodeNoAsign: HierarchyFlat = { ...rootNode };
    nodeNoAsign.node = NODE_NOASIGN;
    nodeNoAsign.node_name = "NO ASIGN";
    nodeNoAsign.parent_node = rootNode.node;
    nodeNoAsign.node_level = rootNode.node_level + 1;
    nodeNoAsign.node_display_order = Number(`${nodeNoAsign.node_level}.999999`);
    this.hierarchyFlat.push(nodeNoAsign);
  }
  /**
   * Rellena el campo del valor del nodo
   * @param rowTree Registro del tree table
   * @param rowHierarchyFlat registro de la jerarquía plana
   */
  private fillTreeNodeField(
    rowTree: HierarchyLiqItemTree,
    rowHierarchyFlat: HierarchyFlat
  ) {
    rowTree[FIELDS_TREE.NODE] = rowHierarchyFlat[FIELDS_TREE.NODE];
    rowTree[FIELDS_TREE.NODE_NAME] = rowHierarchyFlat[FIELDS_TREE.NODE_NAME];
  }
}
