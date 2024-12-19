//import AppComponent from "../Component";
import BaseService from "./baseService";
import JSONModel from "sap/ui/model/json/JSONModel";

export default class BaseState<
  T extends BaseService,
  R extends object
> extends Object {
  protected service: T;
  protected data: R;
  //protected ownerComponent: AppComponent;
  private model: JSONModel;

  constructor(service?: T) {
    super();

    if (service) this.service = service;
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
