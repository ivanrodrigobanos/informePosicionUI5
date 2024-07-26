import BaseState from "./baseState";
import AppComponent from "../Component";
import HierarchyBankService from "cfwreport/service/hierarchyBankService";
import ODataModel from "sap/ui/model/odata/v2/ODataModel";
import HierarchyBankModel, {
  HierarchyBanks,
} from "cfwreport/model/hierarchyBankModel";
import HierarchyBankAccountModel, {
  HierarchyBankTree,
} from "cfwreport/model/hierarchyBankAccountModel";
import BankTreeFieldCatalogModel from "cfwreport/model/bankTreeFieldCatalogModel";
import { FieldsCatalogTree, HierarchysFlat } from "cfwreport/types/types";
import {
  FIELDS_TREE,
  ID_BANK_TREE_TABLE,
} from "cfwreport/constants/treeConstants";

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
  public getHierarchyFlatData(): HierarchysFlat {
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
  public async readHierarchy(hierarchyName: string) {
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
    await this.readHierarchy(hierarchyName);

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
   * Proceso que añade los datos del nivel de tesoreria de una cuenta de banco en la jerarquía.
   * Para ganar en velocidad los datos los añadiré directamente a la jerarquía que se usa en los controles,
   * porque es un nivel que no existe en la jerarquía de bancos
   * @param hierPath Path del nivel de jerarquía donde esta la cuenta.
   */
  public async addPlvHierarchyFromPath(hierPath: string): Promise<string> {
    let hierarchyValue = this.getModel().getProperty(
      hierPath
    ) as HierarchyBankTree;

    let filterValues = this.ownerComponent.getFiltersValues();

    let valuesPlv =
      await this.ownerComponent.accountBankState.readAccountDataPlv({
        bank_account: [hierarchyValue[FIELDS_TREE.NODE]],
        ...filterValues,
      });
    if (valuesPlv.length > 0) {
      this.getData().hierarchyBankAccount.addPlvAccount2HierFlat(
        hierarchyValue[FIELDS_TREE.NODE] as string,
        valuesPlv
      );
      //hierarchyValue[FIELDS_TREE_INTERNAL.CHILD_NODE] = rowsHierarchy;
      //hierarchyValue[FIELDS_TREE_INTERNAL.SHOW_BTN_DETAIL] = false; // No se puede volver a buscar

      //this.getModel().setProperty(hierPath, hierarchyValue);

      this.updateModel();
    }

    return hierPath;
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
