import { TextDisplayOption } from "cfwreport/types/hierarchyTypes";
import BaseModel from "./baseModel";

export type TextDisplayField = Record<string, TextDisplayOption>;

export default class TextDisplayFieldModel extends BaseModel<TextDisplayField> {
  private _data: TextDisplayField;

  constructor(data?: TextDisplayField) {
    super();
    if (data) this._data = data;
    else this._data = {};
  }
  // Indica el modo de vsualización del campo
  public setDisplayTypeField(fieldname: string, option: TextDisplayOption) {
    this._data[fieldname] = option;
  }
  // Obtiene el tipo de visualización del campo
  public getDisplayTypeField(fieldname: string): TextDisplayOption {
    // Si no existe pongo por defecto que solo se ve la clave
    if (!this._data[fieldname])
      this.setDisplayTypeField(fieldname, TextDisplayOption.Text);

    return this._data[fieldname];
  }

  public getData(): TextDisplayField {
    return this._data;
  }

  public clearData() {
    this._data = {};
  }
}
