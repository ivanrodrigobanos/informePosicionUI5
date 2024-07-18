import { TextDisplayOption } from "cfwreport/types/hierarchyTypes";
import BaseStateModel from "./baseStateModel";
import AppComponent from "../Component";

export type TableVisData = {
  displayTypeField: Record<string, TextDisplayOption>;
};

export default class TableVisualizationState extends BaseStateModel<TableVisData> {
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
}
