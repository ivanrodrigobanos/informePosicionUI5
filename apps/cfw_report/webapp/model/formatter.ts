import { QUERY_MODEL } from "cfwreport/constants/models";
import AppComponent from "../Component";
import MainController from "../controller/Main.controller";

export default {
  enabledInputHierLiqItem: function (
    this: MainController,
    hierarchySelected: boolean
  ): boolean {
    const ownerComponent = <AppComponent>this?.getOwnerComponent();

    // Si estoy en la pagina principal devuelvo el valor del radiobutton para que funcione el enabled segun
    // la opción marcada. Es como funcionaria si no se ha navegado a ningúna jerarquía
    if (!this.navContainer.getCurrentPage().getId().indexOf("accountQuery"))
      return hierarchySelected;

    if (
      ownerComponent.queryModel.getProperty(
        QUERY_MODEL.HIERARCHY_LIQITEM_SHOWED
      )
    )
      return true;
    else return hierarchySelected;
  },
  enabledInputBankItem: function (
    this: MainController,
    hierarchySelected: boolean
  ): boolean {
    const ownerComponent = <AppComponent>this?.getOwnerComponent();

    // Si estoy en la pagina principal devuelvo el valor del radiobutton para que funcione el enabled segun
    // la opción marcada. Es como funcionaria si no se ha navegado a ningúna jerarquía
    if (!this.navContainer.getCurrentPage().getId().indexOf("accountQuery"))
      return hierarchySelected;

    if (
      ownerComponent.queryModel.getProperty(QUERY_MODEL.HIERARCHY_BANK_SHOWED)
    )
      return true;
    else return hierarchySelected;
  },
};
