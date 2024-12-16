import AppComponent from "../Component";
import JSONModel from "sap/ui/model/json/JSONModel";
import BaseStateSimple from "./baseStateSimple";

export default class BaseStateModel<R extends object> extends BaseStateSimple {
  protected data: R;
  private model: JSONModel;

  constructor(oComponent: AppComponent) {
    super(oComponent);
  }
  public getModel(): JSONModel {
    if (!this.model) {
      this.model = new JSONModel(this.data);
    }
    return this.model;
  }
  public updateModel(hardRefresh?: boolean): void {
    if (this.model) {
      this.model.refresh(hardRefresh ? true : false);
    }
  }
  protected getData(): R {
    return this.data;
  }
}
