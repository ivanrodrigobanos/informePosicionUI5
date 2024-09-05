import Object from "sap/ui/base/Object";

export default abstract class BaseModel<T> extends Object {
  private busy: boolean;
  constructor() {
    super();
    this.busy = false;
  }
  public setBusy(busy: boolean): void {
    this.busy = busy;
  }
  public abstract getData(): T;
  public abstract clearData(): void;
}
