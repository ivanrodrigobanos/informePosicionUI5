import AppComponent from "../Component";
import ODataModel from "sap/ui/model/odata/v2/ODataModel";
import BaseState from "./baseState";
import HierarchyGeneralInfoModel from "cfwreport/model/hierarchyGeneralInfoModel";
import HierarchyModel from "cfwreport/model/hierarchyModel";
import HierarchyLiqItemService from "cfwreport/service/hierarchyLiqItemService";
import HierarchyLiqItemAccountModel from "cfwreport/model/hierarchyLiqItemAccountModel";
import LiqItemTreeFieldCatalogModel from "cfwreport/model/LiqItemTreeFieldCatalogModel";
import { FieldsCatalogTree, HierarchysFlat } from "cfwreport/types/types";

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
      hierarchyAccount: new HierarchyLiqItemAccountModel(),
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
      this.getData().hierarchy.getData(),
      this.ownerComponent.accountLiqItemState.getAccountData()
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
}
