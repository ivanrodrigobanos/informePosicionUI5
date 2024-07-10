import AppComponent from "../Component";
import BaseService from "cfwreport/service/baseService";
import JSONModel from "sap/ui/model/json/JSONModel";
import BaseStateSimple from "./baseStateSimple";

export default class BaseState<
  T extends BaseService,
  R extends object
> extends BaseStateSimple {
  protected service: T;
  protected data: R;
  private model: JSONModel;

  constructor(oComponent: AppComponent, service?: T) {
    super(oComponent);
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
