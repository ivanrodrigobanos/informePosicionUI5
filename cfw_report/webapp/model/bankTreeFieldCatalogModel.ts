import ResourceBundle from "sap/base/i18n/ResourceBundle";
import TreeFieldCatalogModel, { PropsBuildFcat } from "./treeFieldCatalogModel";
import {
  FIELDS_TREE,
  FIELDS_TREE_ACCOUNT,
  ID_BANK_TREE_TABLE,
} from "cfwreport/constants/treeConstants";
import MetadataState from "cfwreport/state/metadataState";
import { FieldsCatalogTree, HierarchyFlat } from "cfwreport/types/types";
import { ColumnType } from "cfwreport/types/fieldCatalogTypes";
import { HorizontalAlign } from "sap/ui/core/library";

export default class BankTreeFieldCatalogModel extends TreeFieldCatalogModel {
  constructor(metadataState: MetadataState, i18nBundle: ResourceBundle) {
    super(metadataState, i18nBundle);
  }

  public buildFieldCatalog(
    rowHierarchyBankFlat?: HierarchyFlat,
    params?: PropsBuildFcat
  ) {
    this.fieldsCatalog = this.getFixFields(params); // Campos fijos

    // Campos de cantidad, siempre que se haya pasado una fila de valores para poderla construir
    if (rowHierarchyBankFlat) {
      // La posición empieza a partir del tamaño del array. Como las posiciones empiezan por la 0(tal como monta el treetable las columnas) se puede hacer,
      // si empezará por 1 habría que sumarle uno más al tamaño
      let pos = this.fieldsCatalog.length;
      this.fieldsCatalog = this.fieldsCatalog.concat(
        this.amountFields(rowHierarchyBankFlat, pos)
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
          "bankAccountTree.labelColumnNode"
        ) as string,
        quickinfo: this.i18nBundle.getText(
          "bankAccountTree.tooltipColumnNode"
        ) as string,
        internalID: `${ID_BANK_TREE_TABLE}-${pos}`,
        allowPersonalization: false,
        pos: pos,
        type: ColumnType.Text,
        width: FIELDS_TREE_ACCOUNT.NODE_VALUE_WIDTH,
        hAlign: HorizontalAlign.Begin,
        visible: true,
      },
    ];
    pos++;

    /*{
        name: FIELDS_TREE_ACCOUNT.NODE_NAME,
        label: this.i18nBundle.getText(
          "bankAccountTree.labelColumnNodeName"
        ) as string,
        quickinfo: this.i18nBundle.getText(
          "bankAccountTree.tooltipColumnNodeName"
        ) as string,
        pos: pos++,
        type: ColumnType.Text,
        width: FIELDS_TREE_ACCOUNT.NODE_NAME_WIDTH,
        hAlign: HorizontalAlign.Begin,
      },*/

    let fieldInfo = this.metadataState.getFieldInfo(
      FIELDS_TREE_ACCOUNT.BANK_ACCOUNT_PARTNER
    );
    if (fieldInfo) {
      fieldsCatalog.push({
        name: fieldInfo.name,
        label: fieldInfo.label,
        quickinfo: fieldInfo.quickinfo,
        internalID: `${ID_BANK_TREE_TABLE}-${pos}`,
        allowPersonalization: true,
        pos: pos,
        type: ColumnType.Text,
        width: FIELDS_TREE_ACCOUNT.BANK_ACCOUNT_PARTNER_WIDTH,
        hAlign: HorizontalAlign.Begin,
        visible: true,
      });
      pos++;
    }

    fieldInfo = this.metadataState.getFieldInfo(
      FIELDS_TREE_ACCOUNT.COMPANY_CODE
    );
    if (fieldInfo) {
      fieldsCatalog.push({
        name: fieldInfo.name,
        label: fieldInfo.label,
        quickinfo: fieldInfo.quickinfo,
        internalID: `${ID_BANK_TREE_TABLE}-${pos}`,
        allowPersonalization: true,
        pos: pos,
        type: ColumnType.Text,
        width: FIELDS_TREE_ACCOUNT.COMPANY_CODE_NAME_WIDTH,
        hAlign: HorizontalAlign.Begin,
        visible: false,
      });
      pos++;
    }
    fieldInfo = this.metadataState.getFieldInfo(FIELDS_TREE_ACCOUNT.HOUSE_BANK);
    if (fieldInfo) {
      fieldsCatalog.push({
        name: fieldInfo.name,
        label: fieldInfo.label,
        quickinfo: fieldInfo.quickinfo,
        internalID: `${ID_BANK_TREE_TABLE}-${pos}`,
        allowPersonalization: true,
        pos: pos,
        type: ColumnType.Text,
        width: FIELDS_TREE_ACCOUNT.HOUSE_BANK_WIDTH,
        hAlign: HorizontalAlign.Begin,
        visible: false,
      });
      pos++;
    }
    fieldInfo = this.metadataState.getFieldInfo(
      FIELDS_TREE_ACCOUNT.HOUSE_BANK_ACCOUNT
    );
    if (fieldInfo) {
      fieldsCatalog.push({
        name: fieldInfo.name,
        label: fieldInfo.label,
        quickinfo: fieldInfo.quickinfo,
        internalID: `${ID_BANK_TREE_TABLE}-${pos}`,
        allowPersonalization: true,
        pos: pos,
        type: ColumnType.Text,
        width: FIELDS_TREE_ACCOUNT.HOUSE_BANK_ACCOUNT_WIDTH,
        hAlign: HorizontalAlign.Begin,
        visible: false,
      });
      pos++;
    }

    // La columna de importe overdue se muestra si se indica por parámetro
    if (params && params.overdueColumnWithValues) {
      fieldInfo = this.metadataState.getFieldInfo(
        FIELDS_TREE_ACCOUNT.OVERDUE_AMOUNT
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
          width: FIELDS_TREE_ACCOUNT.OVERDUE_AMOUNT_WIDTH,
          hAlign: HorizontalAlign.Begin,
          visible: true,
        });
        pos++;
      }
    }

    return fieldsCatalog;
  }
}
