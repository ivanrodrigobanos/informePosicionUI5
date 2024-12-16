import BaseStateModel from "./baseStateModel";
import AppComponent from "../Component";
import TextDisplayFieldModel from "liqreport/model/textDisplayFieldModel";
import { TextDisplayOption } from "liqreport/types/hierarchyTypes";

export type TableVisData = {
  textDisplayField: TextDisplayFieldModel;
};

export default class TableVisualizationState extends BaseStateModel<TableVisData> {
  constructor(oComponent: AppComponent) {
    super(oComponent);
    this.data = {
      textDisplayField: new TextDisplayFieldModel(),
    };
  }
  /**
   * Obtiene como se tiene que visualizar un campo de texto
   * @param fieldname Nombre del campo
   * @returns
   */
  public getDisplayTypeFieldText(fieldname: string): TextDisplayOption {
    return this.getData().textDisplayField.getDisplayTypeField(fieldname);
  }
  /**
   * Establece como se va a visualizar un campo
   * @param fieldname
   * @param option
   */
  public setDisplayTypeFieldText(fieldname: string, option: TextDisplayOption) {
    return this.getData().textDisplayField.setDisplayTypeField(
      fieldname,
      option
    );
  }
}
