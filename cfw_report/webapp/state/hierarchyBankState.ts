import BaseState from "./baseState";
import AppComponent from "../Component";
import HierarchyBankService from "cfwreport/service/hierarchyBankService";
import ODataModel from "sap/ui/model/odata/v2/ODataModel";
import HierarchyModel, { Hierarchys } from "cfwreport/model/hierarchyModel";
import HierarchyBankAccountModel from "cfwreport/model/hierarchyBankAccountModel";
import BankTreeFieldCatalogModel from "cfwreport/model/bankTreeFieldCatalogModel";
import { FieldsCatalogTree, HierarchyFlat, HierarchysFlat, HierarchyTree } from "cfwreport/types/types";
import {
  FIELDS_TREE,
  ID_BANK_TREE_TABLE,
  NODE_TYPES,
} from "cfwreport/constants/treeConstants";
import {
  NodeAndPathControl,
  NodesAndPathControl,
  NodesDetailInfo,
  ParamsReadHierarchy,
} from "cfwreport/types/hierarchyTypes";
import HierarchyGeneralInfoModel from "cfwreport/model/hierarchyGeneralInfoModel";

export type HierarchyBankData = {
  hierarchy: HierarchyModel;
  hierarchyAccount: HierarchyBankAccountModel;
  treeFieldCatalog: BankTreeFieldCatalogModel;
  generalInfo: HierarchyGeneralInfoModel;
};

export default class HierarchyBankState extends BaseState<
  HierarchyBankService,
  HierarchyBankData
> {
  constructor(oComponent: AppComponent) {
    super(
      oComponent,
      new HierarchyBankService(oComponent.getModel() as ODataModel)
    );
    this.data = {
      generalInfo: new HierarchyGeneralInfoModel(),
      hierarchy: new HierarchyModel(),
      hierarchyAccount: new HierarchyBankAccountModel(),
      treeFieldCatalog: new BankTreeFieldCatalogModel(
        this.ownerComponent.metadataState,
        this.ownerComponent.getI18nBundle()
      ),
    };
  }
  /**
   * Devuelve los datos de la jeraquía
   * @returns Datos de la jerarquía
   */
  public getHierarchyData(): Hierarchys {
    return this.getData().hierarchy.getData();
  }
  /**
   * Devuelve los datos de la jeraquía en formato plano con los datos de las cuentas
   * @returns Datos de la jerarquía
   */
  public getHierarchyFlatData(): HierarchysFlat {
    return this.getData().hierarchyAccount.getFlatData();
  }
  /**
   * Devuelve los datos de la jeraquía en formato arbol, nodos anidados, que es el formato
   * que requiere el Tree Table de UI5 para datos locales
   * @returns Datos de la jerarquía
   */
  public getHierarchyTreeData(): HierarchyTree {
    return this.getData().hierarchyAccount.getData();
  }
  /**
   * Añade el nodo que se ha mostrado información detallada,
   * actualmente es el de la cuenta.
   * @param node Id del nodo
   * @param treePath path del arbol donde se ha hecho el detalle
   * @param nodeType Tipo de nodo:cuenta, nodo de cuentas, etc.
   */
  public addNodeDetailInfo = (node: string, treePath: string, nodeType: string) => {
    this.getData().generalInfo.addNodeDetailInfo(node, treePath, nodeType);
  };
  /**
   * Devuelve los nodos expandidos con su detalle
   * @returns
   */
  public getNodesDetailInfo = (): NodesDetailInfo => {
    return this.getData().generalInfo.getNodesDetailInfo();
  };

  /**
   * Obtención de la jerarquía a partir de un nombre de jerarquía y cuentas
   * @param hierarchyName Nombre que se componente <categoria>/<id> -> CM01/EZTEST
   * @param params Parametros para la lectura
   * @param account Array de cuentas
   */
  public async readHierarchy(
    hierarchyName: string,
    params?: ParamsReadHierarchy
  ) {
    let hierarchyId = hierarchyName.split("/")[1];
    let hierarchyCategory = hierarchyName.split("/")[0];
    let values = await this.service.readHiearchy(
      hierarchyId,
      hierarchyCategory,
      this.ownerComponent.accountBankState.getUniqueBankAccount(),
      params
    );
    this.getData().hierarchy = new HierarchyModel(values);
    this.updateModel();
  }
  /**
   * Proceso de construcción de la jerarquía
   * @param hierarchyName Nombre de la jerarquía
   * @param params Parametros para la lectura
   * @returns
   */
  public async processHierarchyWithAccountData(
    hierarchyName: string,
    params?: ParamsReadHierarchy
  ): Promise<HierarchyTree> {
    await this.readHierarchy(hierarchyName, params);

    this.getData().hierarchyAccount = new HierarchyBankAccountModel(
      this.getData().hierarchy.getData(),
      this.ownerComponent.accountBankState.getAccountData()
    );
    this.getData().treeFieldCatalog.buildFieldCatalog(
      this.getHierarchyFlatData().length > 0
        ? this.getHierarchyFlatData()[0]
        : undefined,
      {
        overdueColumnWithValues:
          this.ownerComponent.accountBankState.checkOverdueColumnWithValues(),
      }
    );

    this.updateModel();
    return this.getHierarchyTreeData();
  }
  /**
   * Regenerado la jerarquía para el arbol a partir de los datos de jerarquía planos.
   */
  public rebuildHierarchyTree() {
    this.getData().hierarchyAccount.buildHierarchyTree();
    this.updateModel();
  }
  /**
   * Permite determinar la criticidad en los nodos cuando hay cambios en la jerarquía.
   */
  public redetermineCriticNodesHierFlat() {
    this.getData().hierarchyAccount.determineCriticNodesHierFlat();
    this.updateModel();
  }

  /**
   * Proceso que añade los datos del nivel de tesoreria de una cuenta de banco en la jerarquía a partir del path
   * de un control
   * @param hierPath Path del nivel de jerarquía donde esta la cuenta.
   */
  public async addPlvHierarchyFromPath(
    hierPath: string
  ): Promise<NodeAndPathControl> {
    let hierarchyValue = this.getModel().getProperty(
      hierPath
    ) as HierarchyTree;

    let rowHierarchyFlat = this.getHierarchyFlatData().find((row: any) => row[FIELDS_TREE.NODE] === hierarchyValue[FIELDS_TREE.NODE]) as HierarchyFlat

    if (rowHierarchyFlat[FIELDS_TREE.NODE_TYPE] === NODE_TYPES.LEAF)
      await this.addPlvHierarchyFromAccount(
        hierarchyValue[FIELDS_TREE.NODE] as string
      )
    else if (rowHierarchyFlat[FIELDS_TREE.NODE_TYPE] === NODE_TYPES.NODE || rowHierarchyFlat[FIELDS_TREE.NODE_TYPE] === NODE_TYPES.ROOT)
      await this.addPlvHierarchyFromNode(
        hierarchyValue[FIELDS_TREE.NODE] as string
      )

    return { node: hierarchyValue[FIELDS_TREE.NODE] as string, path: hierPath, nodeType: rowHierarchyFlat[FIELDS_TREE.NODE_TYPE] as string };
  }
  /**
   * Proceso que añade los datos del nivel de tesoreria de una cuenta de banco en la jerarquía.
   * @param hierPath Path del nivel de jerarquía donde esta la cuenta.
   */
  public async addPlvHierarchyFromAccount(account: string): Promise<string> {
    let filterValues = this.ownerComponent.getFiltersValues();

    let valuesPlv =
      await this.ownerComponent.accountBankState.readAccountDataPlv({
        bank_account: [account],
        ...filterValues,
      });
    if (valuesPlv.length > 0) {
      this.getData().hierarchyAccount.addPlvAccount2HierFlat(
        account,
        valuesPlv
      );
    }

    return account;
  }
  /**
   * Proceso que añade los datos del nivel de tesoreria de un nodo de la jerarquía. Este
   * proceso leera las cuentas que hay por debajo y llamará al mismo proceso que ya existe
   * cuando se selecciona una cuenta
   * @param hierPath Path del nivel de jerarquía donde esta la cuenta.
   */
  public async addPlvHierarchyFromNode(node: string): Promise<string> {
    let promises: Promise<any>[] = [];

    // Recuperamos las cuentas asociadas al nodo y lanzamos el proceso de búsqueda de datos
    let accounts = this.getData().hierarchyAccount.getAccountsFromNode(node)

    for (let x = 0; x < accounts.length; x++) {
      await this.addPlvHierarchyFromAccount(accounts[x])
    }
    // Se añaden los planning level al nodo obtenido
    this.getData().hierarchyAccount.addPlvNode2HierFlat(node)


    return node;
  }

  /**
   * Limpieza de los modelos de datos
   */
  public clearModelValue(noFieldCatalog: boolean = false) {
    this.data.hierarchy.clearData();
    this.data.hierarchyAccount.clearData();
    if (!noFieldCatalog) this.data.treeFieldCatalog.clearData();
    this.updateModel();
  }
  /**
   * Devuelve los campos fijos del catalogo de campos
   * @returns
   */
  public getFixFieldsFieldCatalog(): FieldsCatalogTree {
    return this.data.treeFieldCatalog.getFixFields();
  }
  /**
   * Devuelve el catalogo de campos
   * @returns
   */
  public getFieldCatalog(): FieldsCatalogTree {
    return this.data.treeFieldCatalog.getData();
  }
  /**
   * Devuelve el ID de la columna de la tree table en base al nombre de la columna
   * @param columnName
   * @returns
   */
  public getColumnIdTreeTable(columnName: string): string {
    let index = this.getData()
      .treeFieldCatalog.getData()
      .findIndex((column) => column.name === columnName);
    if (index !== -1) return `${ID_BANK_TREE_TABLE}-${index}`;
    return "";
  }
}
