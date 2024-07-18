import { TextDisplayOption } from "cfwreport/types/hierarchyTypes";
import BaseModel from "./baseModel";

export type DisplayTypeField = Record<string, TextDisplayOption>;

export default class TableVisualizationModel extends BaseModel<DisplayTypeField> {
  private _data: DisplayTypeField;

  constructor(data?: DisplayTypeField) {
    super();
    if (data) this._data = data;
    else this._data = {};
  }
  public getData(): HierarchyBanks {
    return this._hierarchy;
  }

  public clearData() {
    this._hierarchy = [];
  }
}
