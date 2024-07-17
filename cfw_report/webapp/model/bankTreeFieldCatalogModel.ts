import ResourceBundle from "sap/base/i18n/ResourceBundle";
import BaseModel from "./baseModel";
import { FIELDS_TREE_ACCOUNT } from "cfwreport/constants/treeConstants";
import { HierarchyBankFlat } from "./hierarchyBankModel";
import MetadataState from "cfwreport/state/metadataState";
import { ENTITY_FIELDS_DATA } from "cfwreport/constants/smartConstants";
import { ColumnType } from "cfwreport/types/fieldCatalogTypes";
import { FieldsCatalogTree } from "cfwreport/types/types";
import { HorizontalAlign } from "sap/ui/core/library";

export default class BankTreeFieldCatalogModel extends BaseModel<FieldsCatalogTree> {
  private fieldsCatalog: FieldsCatalogTree;
  private metadataState: MetadataState;
  private i18nBundle: ResourceBundle;
  private fieldPos = 1;
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
  public buildFieldCatalog(
    rowHierarchyBankFlat: HierarchyBankFlat | undefined
  ) {
    this.fieldPos = 1;
    this.fieldsCatalog = this.getFixFields(); // Campos fijos

    // Campos de cantidad, siempre que se haya pasado una fila de valores para poderla construir
    if (rowHierarchyBankFlat)
      this.fieldsCatalog = this.fieldsCatalog.concat(
        this.amountFields(rowHierarchyBankFlat ?? {})
      );
  }

  /**
   * Campos fijos del arbol
   * @returns Catalogo de campos
   */
  public getFixFields(): FieldsCatalogTree {
    let fieldsCatalog: FieldsCatalogTree = [
      {
        name: FIELDS_TREE_ACCOUNT.NODE_VALUE,
        label: this.i18nBundle.getText(
          "bankAccountTree.labelColumnNode"
        ) as string,
        quickinfo: this.i18nBundle.getText(
          "bankAccountTree.tooltipColumnNode"
        ) as string,
        pos: this.fieldPos++,
        type: ColumnType.Text,
        width: FIELDS_TREE_ACCOUNT.NODE_VALUE_WIDTH,
        hAlign: HorizontalAlign.Begin,
      },
      {
        name: FIELDS_TREE_ACCOUNT.NODE_NAME,
        label: this.i18nBundle.getText(
          "bankAccountTree.labelColumnNodeName"
        ) as string,
        quickinfo: this.i18nBundle.getText(
          "bankAccountTree.tooltipColumnNodeName"
        ) as string,
        pos: this.fieldPos++,
        type: ColumnType.Text,
        width: FIELDS_TREE_ACCOUNT.NODE_NAME_WIDTH,
        hAlign: HorizontalAlign.Begin,
      },
    ];

    let fieldInfo = this.metadataState.getFieldInfo(
      FIELDS_TREE_ACCOUNT.BANK_ACCOUNT_PARTNER
    );
    if (fieldInfo)
      fieldsCatalog.push({
        name: fieldInfo.name,
        label: fieldInfo.label,
        quickinfo: fieldInfo.quickinfo,
        pos: this.fieldPos++,
        type: ColumnType.Text,
        width: FIELDS_TREE_ACCOUNT.BANK_ACCOUNT_PARTNER_WIDTH,
        hAlign: HorizontalAlign.Begin,
      });

    fieldInfo = this.metadataState.getFieldInfo(
      FIELDS_TREE_ACCOUNT.COMPANY_CODE
    );
    if (fieldInfo)
      fieldsCatalog.push({
        name: fieldInfo.name,
        label: fieldInfo.label,
        quickinfo: fieldInfo.quickinfo,
        pos: this.fieldPos++,
        type: ColumnType.Text,
        width: FIELDS_TREE_ACCOUNT.COMPANY_CODE_NAME_WIDTH,
        hAlign: HorizontalAlign.Begin,
      });

    fieldInfo = this.metadataState.getFieldInfo(
      FIELDS_TREE_ACCOUNT.PLANNING_LEVEL
    );
    if (fieldInfo)
      fieldsCatalog.push({
        name: fieldInfo.name,
        label: fieldInfo.label,
        quickinfo: fieldInfo.quickinfo,
        pos: this.fieldPos++,
        type: ColumnType.Text,
        width: FIELDS_TREE_ACCOUNT.PLANNING_LEVEL_WIDTH,
        hAlign: HorizontalAlign.Begin,
      });
    fieldInfo = this.metadataState.getFieldInfo(FIELDS_TREE_ACCOUNT.HOUSE_BANK);
    if (fieldInfo)
      fieldsCatalog.push({
        name: fieldInfo.name,
        label: fieldInfo.label,
        quickinfo: fieldInfo.quickinfo,
        pos: this.fieldPos++,
        type: ColumnType.Text,
        width: FIELDS_TREE_ACCOUNT.HOUSE_BANK_WIDTH,
        hAlign: HorizontalAlign.Begin,
      });
    fieldInfo = this.metadataState.getFieldInfo(
      FIELDS_TREE_ACCOUNT.HOUSE_BANK_ACCOUNT
    );
    if (fieldInfo)
      fieldsCatalog.push({
        name: fieldInfo.name,
        label: fieldInfo.label,
        quickinfo: fieldInfo.quickinfo,
        pos: this.fieldPos++,
        type: ColumnType.Text,
        width: FIELDS_TREE_ACCOUNT.HOUSE_BANK_ACCOUNT_WIDTH,
        hAlign: HorizontalAlign.Begin,
      });

    fieldInfo = this.metadataState.getFieldInfo(
      FIELDS_TREE_ACCOUNT.OVERDUE_AMOUNT
    );
    if (fieldInfo)
      fieldsCatalog.push({
        name: fieldInfo.name,
        label: fieldInfo.label,
        quickinfo: fieldInfo.quickinfo,
        pos: this.fieldPos++,
        type: ColumnType.Amount,
        width: FIELDS_TREE_ACCOUNT.OVERDUE_AMOUNT_WIDTH,
        hAlign: HorizontalAlign.Begin,
      });

    return fieldsCatalog;
  }
  /**
   * Campos de importe
   */
  private amountFields(
    rowHierarchyBankFlat: HierarchyBankFlat
  ): FieldsCatalogTree {
    let fieldsCatalog: FieldsCatalogTree = [];
    let amountFields = this.metadataState.getAmountFields();
    for (let x = 0; x < amountFields.length; x++) {
      // Obtenemos el campo de la etiqueta que tendrá el campo de importe
      let labelField = amountFields[x].replace(
        ENTITY_FIELDS_DATA.AMOUNT_DATA,
        ENTITY_FIELDS_DATA.AMOUNT_LABEL
      );

      let labelValue = rowHierarchyBankFlat[labelField];
      if (labelValue !== "")
        fieldsCatalog.push({
          name: amountFields[x],
          label: labelValue as string,
          quickinfo: labelValue as string,
          pos: this.fieldPos++,
          type: ColumnType.Amount,
          currencyField: FIELDS_TREE_ACCOUNT.CURRENCY,
          width: FIELDS_TREE_ACCOUNT.AMOUNT_DATA_WIDTH,
          hAlign: HorizontalAlign.Right,
        });
      else break; // Se sale del bucle ya no hay campos informados
    }

    return fieldsCatalog;
  }
}
