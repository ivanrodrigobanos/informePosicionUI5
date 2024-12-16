import { FieldsCatalogTree, HierarchyFlat } from "liqreport/types/types";
import BaseModel from "./baseModel";
import MetadataState from "liqreport/state/metadataState";
import ResourceBundle from "sap/base/i18n/ResourceBundle";
import { ENTITY_FIELDS_DATA } from "liqreport/constants/smartConstants";


export interface PropsBuildFcat {
  overdueColumnWithValues?: boolean;
}

export default abstract class TreeFieldCatalogModel extends BaseModel<FieldsCatalogTree> {
  protected fieldsCatalog: FieldsCatalogTree;
  protected metadataState: MetadataState;
  protected i18nBundle: ResourceBundle;
  constructor(metadataState: MetadataState, i18nBundle: ResourceBundle) {
    super();
    this.i18nBundle = i18nBundle;
    this.metadataState = metadataState;
    this.fieldsCatalog = [];
  }
  public getData(): FieldsCatalogTree {
    return this.fieldsCatalog;
  }
  public clearData(): void {
    this.fieldsCatalog = [];
  }

  /**
   * Campos de importe
   */
  protected amountFields(
    rowHierarchyFlat: HierarchyFlat,
    pos: number
  ): FieldsCatalogTree {
    let fieldsCatalog: FieldsCatalogTree = [];
    let amountFields = this.metadataState.getAmountFields();

    for (let x = 0; x < amountFields.length; x++) {
      // Obtenemos el campo de la etiqueta que tendrá el campo de importe
      let labelField = amountFields[x].replace(
        ENTITY_FIELDS_DATA.AMOUNT_DATA,
        ENTITY_FIELDS_DATA.AMOUNT_LABEL
      );
    }

    return fieldsCatalog;
  }
}
