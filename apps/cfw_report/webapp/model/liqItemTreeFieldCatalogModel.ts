import ResourceBundle from "sap/base/i18n/ResourceBundle";
import TreeFieldCatalogModel, { PropsBuildFcat } from "./treeFieldCatalogModel";
import {
  FIELDS_TREE,
  FIELDS_TREE_LIQITEM,
  ID_BANK_TREE_TABLE,
} from "cfwreport/constants/treeConstants";
import MetadataState from "cfwreport/state/metadataState";
import { FieldsCatalogTree, HierarchyFlat } from "cfwreport/types/types";
import { ColumnType } from "cfwreport/types/fieldCatalogTypes";
import { HorizontalAlign } from "sap/ui/core/library";
import { LIQITEM_ENTITY_SET } from "cfwreport/constants/smartConstants";

export default class LiqItemTreeFieldCatalogModel extends TreeFieldCatalogModel {
  constructor(metadataState: MetadataState, i18nBundle: ResourceBundle) {
    super(metadataState, i18nBundle);
  }

  public buildFieldCatalog(
    rowHierarchyFlat?: HierarchyFlat,
    params?: PropsBuildFcat
  ) {
    this.fieldsCatalog = this.getFixFields(params); // Campos fijos

    // Campos de cantidad, siempre que se haya pasado una fila de valores para poderla construir
    if (rowHierarchyFlat) {
      // La posición empieza a partir del tamaño del array. Como las posiciones empiezan por la 0(tal como monta el treetable las columnas) se puede hacer,
      // si empezará por 1 habría que sumarle uno más al tamaño
      let pos = this.fieldsCatalog.length;
      this.fieldsCatalog = this.fieldsCatalog.concat(
        this.amountFields(rowHierarchyFlat, pos)
      );
    }
  }

  /**
   * Campos fijos del arbol
   * @returns Catalogo de campos
   */
  public getFixFields(params?: PropsBuildFcat): FieldsCatalogTree {
    let pos = 0;
    let fieldsCatalog: FieldsCatalogTree = [
      {
        name: FIELDS_TREE.NODE,
        label: this.i18nBundle.getText(
          "liqItemAccountTree.labelColumnNode"
        ) as string,
        quickinfo: this.i18nBundle.getText(
          "liqItemAccountTree.tooltipColumnNode"
        ) as string,
        internalID: `${ID_BANK_TREE_TABLE}-${pos}`,
        allowPersonalization: false,
        pos: pos,
        type: ColumnType.Text,
        width: FIELDS_TREE_LIQITEM.NODE_VALUE_WIDTH,
        hAlign: HorizontalAlign.Begin,
        visible: true,
      },
    ];
    pos++;

    // La columna de importe overdue se muestra si se indica por parámetro
    if (params && params.overdueColumnWithValues) {
      let fieldInfo = this.metadataState.getFieldInfo(
        FIELDS_TREE_LIQITEM.OVERDUE_AMOUNT,
        LIQITEM_ENTITY_SET
      );
      if (fieldInfo) {
        fieldsCatalog.push({
          name: fieldInfo.name,
          label: fieldInfo.label,
          quickinfo: fieldInfo.quickinfo,
          internalID: `${ID_BANK_TREE_TABLE}-${pos}`,
          allowPersonalization: false,
          pos: pos++,
          type: ColumnType.Amount,
          width: FIELDS_TREE_LIQITEM.OVERDUE_AMOUNT_WIDTH,
          hAlign: HorizontalAlign.Right,
          visible: true,
        });
        pos++;
      }
    }

    return fieldsCatalog;
  }
}
