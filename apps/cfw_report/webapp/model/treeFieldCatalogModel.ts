import { FieldsCatalogTree, HierarchyFlat } from "cfwreport/types/types";
import BaseModel from "./baseModel";
import MetadataState from "cfwreport/state/metadataState";
import ResourceBundle from "sap/base/i18n/ResourceBundle";
import { ENTITY_FIELDS_DATA } from "cfwreport/constants/smartConstants";
import {
  FIELDS_TREE_ACCOUNT,
  ID_BANK_TREE_TABLE,
} from "cfwreport/constants/treeConstants";
import { ColumnType } from "cfwreport/types/fieldCatalogTypes";
import { HorizontalAlign } from "sap/ui/core/library";
import DateFormat from "cfwreport/utils/dateFormat";

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

      let labelValue = rowHierarchyFlat[labelField];
      if (labelValue !== "") {
        fieldsCatalog.push({
          name: amountFields[x],
          label: DateFormat.convertSAPDate2Locale(labelValue as string),
          quickinfo: labelValue as string,
          internalID: `${ID_BANK_TREE_TABLE}-${pos}`,
          allowPersonalization: false,
          pos: pos,
          type: ColumnType.Amount,
          currencyField: FIELDS_TREE_ACCOUNT.CURRENCY,
          width: FIELDS_TREE_ACCOUNT.AMOUNT_DATA_WIDTH,
          hAlign: HorizontalAlign.Right,
          visible: true,
        });
        pos++;
      } else break; // Se sale del bucle ya no hay campos informados
    }

    return fieldsCatalog;
  }
}
