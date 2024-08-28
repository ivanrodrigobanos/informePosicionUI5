import BaseHierarchy from "./baseHierarchy";
import { Hierarchy, Hierarchys } from "./hierarchyModel";
import {
  FIELDS_TREE,
  FIELDS_TREE_ACCOUNT,
  FIELDS_TREE_INTERNAL,
  NODE_TYPES,
  SOURCE_TYPES,
} from "cfwreport/constants/treeConstants";
import {
  HierarchyFlat,
  HierarchysFlat,
  HierarchyTree,
} from "cfwreport/types/types";
import { AccountData, AccountsData } from "cfwreport/types/accountBankTypes";

export default class HierarchyBankAccountModel extends BaseHierarchy<HierarchyTree> {
  private hierarchyTree: HierarchyTree;

  private accountData: AccountsData;

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
  public getData(): HierarchyTree {
    return this.hierarchyTree;
  }

  /**
   * Construye la jerarquía para el arbol borrando los registros previos
   */
  public buildHierarchyTree() {
    this.hierarchyTree = [];
    this.hierarchyTree = this._buildHierarchyTree();
  }
  /**
   * Añade los datos del planning level de una cuenta a la jerarquía plana.
   * @param values
   */
  public addPlvAccount2HierFlat(node: string, values: AccountsData) {
    let nodeIndex = this.hierarchyFlat.findIndex(
      (row) => row[FIELDS_TREE.NODE] === node
    );

    if (nodeIndex === -1) return;

    // Se añaden los registros que no sean saldo final
    values
      .filter((row) => row.source !== SOURCE_TYPES.SALDO_FIN)
      .forEach((value) => {
        let rowTree: HierarchyFlat = {};
        rowTree = this.fillAccountDataInRowHierFlat(value, rowTree); // Campos de importe
        rowTree[FIELDS_TREE.NODE] = value[FIELDS_TREE_ACCOUNT.PLANNING_LEVEL];
        rowTree[FIELDS_TREE.NODE_NAME] =
          value[FIELDS_TREE_ACCOUNT.PLANNING_LEVEL_NAME];
        rowTree[FIELDS_TREE.PARENT_NODE] = node;
        rowTree[FIELDS_TREE.NODE_TYPE] = NODE_TYPES.PLANNING_LEVEL;
        rowTree[FIELDS_TREE.NODE_LEVEL] =
          Number(this.hierarchyFlat[nodeIndex][FIELDS_TREE.NODE_LEVEL]) + 1;
        rowTree[FIELDS_TREE.NODE_DISPLAY_ORDER] =
          this.hierarchyFlat[nodeIndex][FIELDS_TREE.NODE_DISPLAY_ORDER];

        this.hierarchyFlat.push(rowTree);
      });

    // Se actualiza el importe en el nodo de la cuenta apartir del valor saldo final de los datos
    // leídos
    let accountSaldoFinal = values.find(
      (row) => row.source === SOURCE_TYPES.SALDO_FIN
    );
    if (accountSaldoFinal) {
      // Se guardan el valor original para restarlo en recalculo de importe en los nodos superiores
      let oldValues = structuredClone(this.hierarchyFlat[nodeIndex]);

      this.hierarchyFlat[nodeIndex] = this.fillAmountData(
        this.hierarchyFlat[nodeIndex],
        accountSaldoFinal
      );

      // Actualización de los nodos superiores
      this.updateAmountParentNodes(
        oldValues,
        this.hierarchyFlat[nodeIndex],
        this.hierarchyFlat[nodeIndex][FIELDS_TREE.PARENT_NODE] as string
      );
    }
  }

  /**
   * Construye la jerarquía en formato arbol, nodos anidados, a partir de
   * la jerarquía plana.
   * @returns Jerarquía en formato arbol
   */
  private _buildHierarchyTree(): HierarchyTree {
    // tiene que haber un primer campo donde contenga el resto de arrays
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
          else if (rowFlat[FIELDS_TREE.NODE_TYPE] === NODE_TYPES.PLANNING_LEVEL)
            this.fillTreePlvData(rowTree, rowFlat);
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
    let existPlvNode = this.existAccountWithPlv(
      rowHierarchyFlat[FIELDS_TREE.NODE] as string,
      this.hierarchyFlat
    );
    rowTree[FIELDS_TREE_INTERNAL.LOADING_VALUES] = false;
    rowTree[FIELDS_TREE_INTERNAL.SHOW_BTN_DETAIL] = !existPlvNode;

    if (existPlvNode)
      this.fillTreeSubnodes(rowTree, rowHierarchyFlat[FIELDS_TREE.NODE]);
  }
  /**
   * Rellena los datos de los planning level
   * @param rowTree
   * @param rowHierarchyFlat
   */
  private fillTreePlvData(
    rowTree: HierarchyTree,
    rowHierarchyFlat: HierarchyFlat
  ) {
    // Hago esta ñapa para pasar solo los campos que son de la cuenta.
    Object.keys(this.accountData[0]).forEach((key) => {
      rowTree[key] = rowHierarchyFlat[key as keyof AccountData];
    });

    // En el planning level se cambia el nodo y nombre ya que lo que viene es la cuenta del banco.
    rowTree[FIELDS_TREE.NODE] =
      rowHierarchyFlat[FIELDS_TREE_ACCOUNT.PLANNING_LEVEL];
    rowTree[FIELDS_TREE.NODE_NAME] =
      rowHierarchyFlat[FIELDS_TREE_ACCOUNT.PLANNING_LEVEL_NAME];
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

    this.accountData
      .filter((row) => row.source === SOURCE_TYPES.SALDO_FIN)
      .forEach((row) => {
        let hierarchyFlatRow = this.hierarchyFlat.find(
          (rowHierFlat) => rowHierFlat.node === row.bank_account
        );

        // Añade los datos de la cuenta a la jerarquía plana y nos devuelve el indice donde se ha insertado
        if (!hierarchyFlatRow)
          hierarchyFlatRow = this.addAccountHierarchyFlat(
            row,
            this.hierarchyFlat
          );

        if (hierarchyFlatRow) this.addSumUpperNodesFlat(hierarchyFlatRow);
      });

    // Ordenacion para que quede los niveles de arriba abajo. Y dentro del mismo nivel que se vean de mayor a menor segun
    // su orden de visualización
    this.hierarchyFlat = this._sortHierarchyFlat(this.hierarchyFlat);
  }

  /**
   * Añade el registro de la cuenta y nivel de jerarquía
   * @param accountData
   * @param hierarchyFlat
   */
  private addAccountHierarchyFlat(
    accountData: AccountData,
    hierarchyFlat: HierarchysFlat
  ): HierarchyFlat | undefined {
    let hierarchyData = this.hierarchy.find(
      (rowHier: any) => rowHier[FIELDS_TREE.NODE] === accountData.bank_account
    ) as Hierarchy;
    // La cuenta debería estar en la jerarquía, dentro de un nodo de la jerarquía o en el nodo sin asignar. Pero
    // hay datos de cuenta en el S4D cuyo valor es blanco y provoca problemas en la construcción, y es aquí, donde
    // si llegan cuentas raras no se procesan.
    if (!hierarchyData) return undefined;

    // Pasamos los datos de la jeraquía
    let newRow: HierarchyFlat = {};
    Object.keys(hierarchyData).forEach((key) => {
      newRow[key] = hierarchyData[key as keyof Hierarchy];
    });
    // Pasamos los datos de la cuenta
    newRow = this.fillAccountDataInRowHierFlat(accountData, newRow);

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
   * Devuelve si una cuenta tiene subnodo de nivel de tesoreria
   * @param accountNode
   * @param hierarchyFlat
   * @returns
   */
  private existAccountWithPlv(
    accountNode: string,
    hierarchyFlat: HierarchysFlat
  ): boolean {
    if (
      hierarchyFlat.findIndex(
        (row) =>
          row[FIELDS_TREE.PARENT_NODE] == accountNode &&
          row[FIELDS_TREE.NODE_TYPE] == NODE_TYPES.PLANNING_LEVEL
      ) === -1
    )
      return false;
    else return true;
  }
}
