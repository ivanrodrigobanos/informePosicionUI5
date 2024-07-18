import BaseState from "./baseState";
import AppComponent from "../Component";
import HierarchyBankService from "cfwreport/service/hierarchyBankService";
import ODataModel from "sap/ui/model/odata/v2/ODataModel";
import HierarchyBankModel, {
  HierarchyBankFlats,
  HierarchyBanks,
} from "cfwreport/model/hierarchyBankModel";
import HierarchyBankAccountModel, {
  HierarchyBankTree,
} from "cfwreport/model/hierarchyBankAccountModel";
import BankTreeFieldCatalogModel from "cfwreport/model/bankTreeFieldCatalogModel";
import { FieldsCatalogTree } from "cfwreport/types/types";
import { ID_BANK_TREE_TABLE } from "cfwreport/constants/treeConstants";

export type HierarchyBankData = {
  hierarchyBank: HierarchyBankModel;
  hierarchyBankAccount: HierarchyBankAccountModel;
  treeFieldCatalog: BankTreeFieldCatalogModel;
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
      hierarchyBank: new HierarchyBankModel(),
      hierarchyBankAccount: new HierarchyBankAccountModel(),
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
  public getHierarchyData(): HierarchyBanks {
    return this.getData().hierarchyBank.getData();
  }
  /**
   * Devuelve los datos de la jeraquía en formato plano con los datos de las cuentas
   * @returns Datos de la jerarquía
   */
  public getHierarchyFlatData(): HierarchyBankFlats {
    return this.getData().hierarchyBankAccount.getFlatData();
  }
  /**
   * Devuelve los datos de la jeraquía en formato arbol, nodos anidados, que es el formato
   * que requiere el Tree Table de UI5 para datos locales
   * @returns Datos de la jerarquía
   */
  public getHierarchyTreeData(): HierarchyBankTree {
    return this.getData().hierarchyBankAccount.getData();
  }
  /**
   * Obtención de la jerarquía a partir de un nombre de jerarquía y cuentas
   * @param hierarchyName Nombre que se componente <categoria>/<id> -> CM01/EZTEST
   * @param account Array de cuentas
   */
  public async ReadHierarchy(hierarchyName: string) {
    let hierarchyId = hierarchyName.split("/")[1];
    let hierarchyCategory = hierarchyName.split("/")[0];
    let values = await this.service.readHiearchy(
      hierarchyId,
      hierarchyCategory,
      this.ownerComponent.accountBankState.getUniqueBankAccount()
    );
    this.getData().hierarchyBank = new HierarchyBankModel(values);
    this.updateModel();
  }
  /**
   * Proceso de construcción de la jerarquía
   * @param hierarchyName Nombre de la jerarquía
   * @returns
   */
  public async processHierarchyWithAccountData(
    hierarchyName: string
  ): Promise<HierarchyBankTree> {
    await this.ReadHierarchy(hierarchyName);

    this.getData().hierarchyBankAccount = new HierarchyBankAccountModel(
      this.getData().hierarchyBank.getData(),
      this.ownerComponent.accountBankState.getAccountData()
    );
    this.getData().treeFieldCatalog.buildFieldCatalog(
      this.getHierarchyFlatData()[0],
      {
        overdueColumnWithValues:
          this.ownerComponent.accountBankState.checkOverdueColumnWithValues(),
      }
    );

    this.updateModel();
    return this.getHierarchyTreeData();
  }
  /**
   * Limpieza de los modelos de datos
   */
  public clearModelValue(noFieldCatalog: boolean = false) {
    this.data.hierarchyBank.clearData();
    this.data.hierarchyBankAccount.clearData();
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
