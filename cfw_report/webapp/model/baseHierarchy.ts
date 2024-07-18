import { TextDisplayOption } from "cfwreport/types/hierarchyTypes";
import Object from "sap/ui/base/Object";

export default abstract class BaseHierarchy<T> extends Object {
  private busy: boolean;
  protected displayTypeField: Record<string, TextDisplayOption>;
  constructor() {
    super();
    this.busy = false;
  }
  public setBusy(busy: boolean): void {
    this.busy = busy;
  }
  // Indica el modo de vsualización del campo
  public setDisplayTypeField(fieldname: string, option: TextDisplayOption) {
    this.displayTypeField[fieldname] = option;
  }
  // Obtiene el tipo de visualización del campo
  public getDisplayTypeField(fieldname: string): TextDisplayOption {
    // Si no existe pongo por defecto que solo se ve la clave
    if (!this.displayTypeField[fieldname])
      this.setDisplayTypeField(fieldname, TextDisplayOption.Key);

    return this.displayTypeField[fieldname];
  }
  public abstract getData(): T;
  public abstract clearData(): void;
}
