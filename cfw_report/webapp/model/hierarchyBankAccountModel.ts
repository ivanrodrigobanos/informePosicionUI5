import { ENTITY_FIELDS_DATA } from "cfwreport/constants/smartConstants";
import { AccountData, AccountsData } from "./accountBankModel";
import BaseModel from "./baseModel";
import { HierarchyBank, HierarchyBanks } from "./hierarchyBankModel";
import { FIELDS_TREE } from "cfwreport/constants/treeConstants";

export type HierarchyBankFlat = Record<string, string | number>;
export type HierarchyBankFlats = HierarchyBankFlat[];

export type HierarchyBankTree = Record<string, any>;

export default class HierarchyBankAccountModel extends BaseModel<HierarchyBankTree> {
  private hierarchyFlat: HierarchyBankFlats;
  private hierarchyTree: HierarchyBankTree;
  private hierarchyBank: HierarchyBanks;
  private accountData: AccountsData;

  constructor(hierarchyBank?: HierarchyBanks, accountData?: AccountsData) {
    super();
    this.hierarchyFlat = [];
    this.hierarchyTree = [];

    if (hierarchyBank && accountData) {
      this.hierarchyBank = hierarchyBank;
      this.accountData = accountData;
      this.hierarchyFlat = this.buildHierarchyFlat();
      this.hierarchyTree = this.buildHierarchyTree();
    }
  }

  public getFlatData(): HierarchyBankFlats {
    return this.hierarchyFlat;
  }
  public getData(): HierarchyBankTree {
    return this.hierarchyTree;
  }
  /**
   * Construye la jerarquía en formato arbol, nodos anidados, a partir de
   * la jerarquía plana.
   * @returns Jerarquía en formato arbol
   */
  private buildHierarchyTree(): HierarchyBankTree {
    // tiene que haber un primer campo donde contenga el resto de arrays
    let hierarchyTree: HierarchyBankTree = {};

    if (this.hierarchyFlat.length === 0) return hierarchyTree;

    // El primer nivel es el registro 0 de la jerarquía plana
    let rowTree: HierarchyBankTree = {};
    this.fillTreeAmountData(rowTree, this.hierarchyFlat[0]); // Campos de importe y etiquetas
    this.fillTreeNodeField(rowTree, this.hierarchyFlat[0]); // Nombre del nodo

    // Rellena los nodos inferiores
    this.fillTreeSubnodes(rowTree, this.hierarchyFlat[0].node);

    hierarchyTree.accounts = [rowTree];

    return hierarchyTree;
  }
  /**
   * Rellena los nodos inferiores de la jerarquía
   * @param parentRowTree fila del nodo superior
   * @param parentNode Nodo superior
   */
  fillTreeSubnodes(
    parentRowTree: HierarchyBankTree,
    parentNode: string | number
  ) {
    let rowTreeArray: Array<HierarchyBankTree> = [];
    // Si el nodo padre no tiene nodo inferior ni continuamos.
    if (
      this.hierarchyFlat.findIndex(
        (rowFlat) => rowFlat.parent_node === parentNode
      ) !== -1
    ) {
      this.hierarchyFlat
        .filter((rowFlat) => rowFlat.parent_node === parentNode)
        .forEach((rowFlat) => {
          let rowTree: HierarchyBankTree = {};

          this.fillTreeNodeField(rowTree, rowFlat); // Nombre del nodo
          this.fillTreeAmountData(rowTree, rowFlat); // Campos de importe y etiquetas

          // El tipo nodo L es el nodo de cuenta y no tendrá más niveles por debajo. Además, en este nodo hay que informar
          // los campos de la propia cuenta
          if (rowFlat.node_type === "L") {
            this.fillTreeAccountData(rowTree, rowFlat);
          } else {
            this.fillTreeSubnodes(rowTree, rowFlat.node);
          }

          rowTreeArray.push(rowTree);
        });

      parentRowTree.accounts = rowTreeArray;
    }
  }
  /**
   * Informa los campos de la cuenta bancaria al registro del nodo
   * @param rowTree Registro del tree table
   * @param rowHierarchyFlat registro de la jerarquía plana
   */
  fillTreeAccountData(
    rowTree: HierarchyBankTree,
    rowHierarchyFlat: HierarchyBankFlat
  ) {
    // Hago esta ñapa para pasar solo los campos que son de la cuenta.
    Object.keys(this.accountData[0]).forEach((key) => {
      rowTree[key] = rowHierarchyFlat[key as keyof AccountData];
    });
  }
  public clearData(): void {
    this.hierarchyFlat = [];
    this.hierarchyTree = [];
  }
  /**
   * Rellena los campos de importe y cabecera que tendrá el importe del registro de la jerarquía plana a la del arbol
   * @param rowTree Registro del tree table
   * @param rowHierarchyFlat registro de la jerarquía plana
   */
  private fillTreeAmountData(
    rowTree: HierarchyBankTree,
    rowHierarchyFlat: HierarchyBankFlat
  ) {
    Object.keys(rowHierarchyFlat)
      .filter(
        (rowKey) =>
          rowKey.includes(ENTITY_FIELDS_DATA.AMOUNT_DATA) ||
          rowKey.includes(ENTITY_FIELDS_DATA.AMOUNT_LABEL)
      )
      .forEach((key) => {
        rowTree[key] = rowHierarchyFlat[key];
      });
    rowTree[FIELDS_TREE.CURRENCY] = rowHierarchyFlat[FIELDS_TREE.CURRENCY];
  }
  /**
   * Rellena el campo del valor del nodo
   * @param rowTree Registro del tree table
   * @param rowHierarchyFlat registro de la jerarquía plana
   */
  private fillTreeNodeField(
    rowTree: HierarchyBankTree,
    rowHierarchyFlat: HierarchyBankFlat
  ) {
    rowTree[FIELDS_TREE.NODE_VALUE] = rowHierarchyFlat["node"];
    rowTree[FIELDS_TREE.NODE_NAME] = rowHierarchyFlat["node_name"];
  }
  private buildHierarchyFlat(): HierarchyBankFlats {
    let hierarchyFlat: HierarchyBankFlats = [];

    this.accountData.forEach((row) => {
      let hierarchyFlatRow = hierarchyFlat.find(
        (rowHierFlat) => rowHierFlat.node === row.bank_account
      );

      // Añade los datos de la cuenta a la jerarquía plana y nos devuelve el indice donde se ha insertado
      if (!hierarchyFlatRow)
        hierarchyFlatRow = this.addAccountHierarchyFlat(row, hierarchyFlat);

      this.addSumUpperNodesFlat(hierarchyFlatRow, hierarchyFlat);
    });

    // Ordenacion para que quede los niveles de arriba abajo. Y dentro del mismo nivel que se vean de mayor a menor segun
    // su orden de visualización
    return hierarchyFlat.sort((a, b) => {
      if ((a.node_level as number) < (b.node_level as number)) {
        return -1;
      } else if ((a.node_level as number) === (b.node_level as number)) {
        if ((a.node_display_order as number) > (b.node_display_order as number))
          return -1;
        else if (
          (a.node_display_order as number) < (b.node_display_order as number)
        )
          return 1;
        else return 0;
      } else {
        return 1;
      }
    });
  }
  /**
   * Añade y sumariza los registros de los nodos superiores
   * @param hierarchyFlatRow Registro de la jerarquía plana
   * @param hierarchyFlat Array de la jerarquía plana
   */
  addSumUpperNodesFlat(
    hierarchyFlatRow: HierarchyBankFlat,
    hierarchyFlat: HierarchyBankFlats
  ) {
    let hierarchyFlatUpperIndex = hierarchyFlat.findIndex(
      (row) => row.node === hierarchyFlatRow.parent_node
    );
    if (hierarchyFlatUpperIndex === -1)
      hierarchyFlatUpperIndex = this.addUpperNodeFlat(
        hierarchyFlatRow.parent_node,
        hierarchyFlat
      );

    if (hierarchyFlatUpperIndex !== -1) {
      hierarchyFlat[hierarchyFlatUpperIndex][FIELDS_TREE.CURRENCY] =
        hierarchyFlatRow[FIELDS_TREE.CURRENCY];
      Object.keys(hierarchyFlatRow)
        .filter(
          (rowKey) =>
            rowKey.includes(ENTITY_FIELDS_DATA.AMOUNT_DATA) ||
            rowKey.includes(ENTITY_FIELDS_DATA.AMOUNT_LABEL)
        )
        .forEach((key) => {
          if (key.includes(ENTITY_FIELDS_DATA.AMOUNT_DATA))
            if (hierarchyFlat[hierarchyFlatUpperIndex][key])
              hierarchyFlat[hierarchyFlatUpperIndex][key] =
                (hierarchyFlat[hierarchyFlatUpperIndex][key] as number) +
                (hierarchyFlatRow[key] as number);
            else
              hierarchyFlat[hierarchyFlatUpperIndex][key] =
                hierarchyFlatRow[key];
          else
            hierarchyFlat[hierarchyFlatUpperIndex][key] = hierarchyFlatRow[key];
        });

      // Se vuelve a llamar al método para que sumarize el nodo padre
      this.addSumUpperNodesFlat(
        hierarchyFlat[hierarchyFlatUpperIndex],
        hierarchyFlat
      );
    }
  }
  /**Añade el nodo superior a la jerarquía plana */
  addUpperNodeFlat(
    parent_node: string | number,
    hierarchyFlat: HierarchyBankFlats
  ): number {
    let hierarchyData = this.hierarchyBank.find(
      (rowHier) => rowHier.node === parent_node
    ) as HierarchyBank;

    if (!hierarchyData) return -1;

    let newRow: HierarchyBankFlat = {};
    Object.keys(hierarchyData).forEach((key) => {
      newRow[key] = hierarchyData[key as keyof HierarchyBank];
    });
    hierarchyFlat.push(newRow);

    // se devuelve el indice del registro insertado
    return hierarchyFlat.findIndex((row) => row.node === parent_node);
  }
  /**
   * Añade el registro de la cuenta y nivel de jerarquía
   * @param accountData
   * @param hierarchyFlat
   */
  private addAccountHierarchyFlat(
    accountData: AccountData,
    hierarchyFlat: HierarchyBankFlats
  ): HierarchyBankFlat {
    let hierarchyData = this.hierarchyBank.find(
      (rowHier) => rowHier.node === accountData.bank_account
    ) as HierarchyBank;

    // Pasamos los datos de la jeraquía
    let newRow: HierarchyBankFlat = {};
    Object.keys(hierarchyData).forEach((key) => {
      newRow[key] = hierarchyData[key as keyof HierarchyBank];
    });
    // Pasamos los datos de la cuenta
    Object.keys(accountData).forEach((key) => {
      newRow[key] = accountData[key as keyof AccountData];
    });

    hierarchyFlat.push(newRow);

    // Devuelve la posición insertada
    return newRow;
  }
}
