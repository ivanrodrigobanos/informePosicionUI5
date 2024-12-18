import AppComponent from "../Component";
import ODataModel from "sap/ui/model/odata/v2/ODataModel";
import BaseState from "./baseState";
import HierarchyGeneralInfoModel from "liqreport/model/hierarchyGeneralInfoModel";
import HierarchyModel from "liqreport/model/hierarchyModel";
import HierarchyLiqItemService from "liqreport/service/hierarchyLiqItemService";
import HierarchyLiqItemAccountModel from "liqreport/model/hierarchyLiqItemAccountModel";
import LiqItemTreeFieldCatalogModel from "liqreport/model/liqItemTreeFieldCatalogModel";
import { FieldsCatalogTree, HierarchysFlat } from "liqreport/types/types";
import { ID_LIQITEM_TREE_TABLE } from "liqreport/constants/treeConstants";

export type HierarchyLiqItemData = {
  hierarchy: HierarchyModel;
  hierarchyAccount: HierarchyLiqItemAccountModel;
  treeFieldCatalog: LiqItemTreeFieldCatalogModel;
  generalInfo: HierarchyGeneralInfoModel;
};

export default class HierarchyLiqItemState extends BaseState<
  HierarchyLiqItemService,
  HierarchyLiqItemData
> {
  constructor(oComponent: AppComponent) {
    super(
      oComponent,
      new HierarchyLiqItemService(oComponent.getModel() as ODataModel)
    );
    this.data = {
      generalInfo: new HierarchyGeneralInfoModel(),
      hierarchy: new HierarchyModel(),
      hierarchyAccount: new HierarchyLiqItemAccountModel(this.ownerComponent.getI18nBundle()),
      treeFieldCatalog: new LiqItemTreeFieldCatalogModel(
        this.ownerComponent.metadataState,
        this.ownerComponent.getI18nBundle()
      ),
    };
  }
  /**
   * Obtención de la jerarquía a partir de un nombre de jerarquía y cuentas
   * @param hierarchyName Nombre que se componente <categoria>/<id> -> CM01/EZTEST
   * @param params Parametros para la lectura
   * @param account Array de cuentas
   */
  public async readHierarchy(hierarchyName: string) {
    let values = await this.service.readHiearchy(hierarchyName);
    this.getData().hierarchy = new HierarchyModel(values);
    this.updateModel();
  }
  /**
   * Proceso de construcción de la jerarquía
   * @returns
   */
  public processBuildHierarchy() {    
    this.getData().hierarchyAccount = new HierarchyLiqItemAccountModel(
      this.ownerComponent.getI18nBundle(),
      this.getData().hierarchy.getData(),
      this.ownerComponent.accountLiqItemState.getAccountData()
    );

    this.getData().treeFieldCatalog.buildFieldCatalog(
      this.getHierarchyFlatData().length > 0
        ? this.getHierarchyFlatData()[0]
        : undefined,
    );

    this.updateModel();
  }
  /**
   * Devuelve los datos de la jeraquía en formato plano con los datos de las cuentas
   * @returns Datos de la jerarquía
   */
  public getHierarchyFlatData(): HierarchysFlat {
    return this.getData().hierarchyAccount.getFlatData();
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
    if (index !== -1) return `${ID_LIQITEM_TREE_TABLE}-${index}`;
    return "";
  }
}
