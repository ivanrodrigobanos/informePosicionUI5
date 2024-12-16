import Object from "sap/ui/base/Object";
import AppComponent from "../Component";

export default class BaseStateSimple extends Object {
  protected ownerComponent: AppComponent;
  constructor(oComponent: AppComponent) {
    super();
    this.ownerComponent = oComponent;
  }
}
