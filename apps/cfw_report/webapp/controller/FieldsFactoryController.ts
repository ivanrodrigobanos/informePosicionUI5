import View from "sap/ui/core/mvc/View";
import BaseStateSimple from "cfwreport/state/baseStateSimple";
import AppComponent from "../Component";
import { FieldCatalogTree } from "cfwreport/types/types";
import Control from "sap/ui/core/Control";
import {
  CUSTOM_DATA,
  FIELDS_TREE,
  FIELDS_TREE_ACCOUNT,
  FIELDS_TREE_INTERNAL,
  STATE_PATH,
} from "cfwreport/constants/treeConstants";
import { ColumnType } from "cfwreport/types/fieldCatalogTypes";
import Text from "sap/m/Text";
import FlexBox from "sap/m/FlexBox";
import Button from "sap/m/Button";
import BankTreeViewController from "./BankTreeViewController";
import Formatters from "cfwreport/utils/formatters";
import { ENTITY_FIELDS_DATA } from "cfwreport/constants/smartConstants";
import ObjectStatus from "sap/m/ObjectStatus";
import Conversion from "cfwreport/utils/conversion";
import CustomData from "sap/ui/core/CustomData";

export default class FieldsFactoryController extends BaseStateSimple {
  protected view: View;
  protected bankTreeViewController: BankTreeViewController;
  constructor(
    oComponent: AppComponent,
    view: View,
    bankTreeViewController: BankTreeViewController
  ) {
    super(oComponent);
    this.view = view;
    this.bankTreeViewController = bankTreeViewController;
  }
  /**
   * Devuevle el control donde se pinta el valor en las tablas dinámicas
   * en base a la configuración del campo
   * @param fieldCatalog Datos del catalogo de campo
   * @param statePath Path de acceso al modelo de datos
   * @returns
   */
  public getTemplateObjectforTableColumn(
    fieldCatalog: FieldCatalogTree,
    statePath: string
  ): Control {
    if (fieldCatalog.name === FIELDS_TREE_ACCOUNT.COMPANY_CODE)
      return this.templateObjectCompany(fieldCatalog.name, statePath);

    if (fieldCatalog.name === FIELDS_TREE.NODE)
      return this.templateObjectNodeValue(fieldCatalog.name, statePath);

    if (fieldCatalog.type === ColumnType.Amount) {
      return this.templateObjectAmount(fieldCatalog.name, statePath);
    }

    return new Text({
      text: { path: `${statePath}>${fieldCatalog.name}` },
    });
  }
  /**
   * Template del control para la columna de sociedad
   * @param name
   * @param statePath
   * @returns
   */
  private templateObjectCompany(name: string, statePath: string): Control {
    return new Text({
      text: {
        parts: [
          { path: `${statePath}>${name}` },
          {
            path: `${statePath}>${FIELDS_TREE_ACCOUNT.COMPANY_CODE_NAME}`,
          },
        ],
        formatter: function (companyCode: string, companyCodeName: string) {
          if (companyCode && companyCodeName)
            return `${companyCodeName} (${companyCode})`;
          else return "";
        },
      },
    });
  }
  /**
   * Template del control para la columna del nodo
   * @param name
   * @param statePath
   * @returns
   */
  private templateObjectNodeValue(name: string, statePath: string): Control {
    var that = this;
    return new FlexBox({
      direction: "Row",
      alignItems: "Center",
      items: [
        new Button({
          icon: "sap-icon://expand-all",
          busy: {
            path: `${statePath}>${FIELDS_TREE_INTERNAL.LOADING_VALUES}`,
          },
          busyIndicatorSize: "Medium",
          tooltip: this.ownerComponent
            .getI18nBundle()
            .getText("bankAccountTree.btnDetailPlv"),
          visible: {
            path: `${statePath}>${FIELDS_TREE_INTERNAL.SHOW_BTN_PLV}`,
          },
          press(oEvent: any) {
            let oRow = oEvent.getSource().getParent();

            if (statePath === STATE_PATH.HIERARCHY_BANK) {
              that.bankTreeViewController.processAddPlanningLevelData([
                oRow.getBindingContext(statePath).getPath() as string,
              ]);
            }
          },
        }).addStyleClass("sapUiTinyMarginEnd"),
        new Text({
          text: {
            parts: [
              { path: `${statePath}>${name}` },
              { path: `${statePath}>${FIELDS_TREE.NODE_NAME}` },
            ],
            formatter: function (key: string, text: string) {
              return Formatters.fieldKeyText(
                key,
                text,
                that.ownerComponent.tableVisualizationState.getDisplayTypeFieldText(
                  name
                )
              );
            },
          },
        }),
      ],
    });
  }
  /**
   * Template del control para la columna de importe
   * @param name
   * @param statePath
   * @returns
   */
  private templateObjectAmount(name: string, statePath: string): Control {
    let criticField = name.replace(
      ENTITY_FIELDS_DATA.AMOUNT_DATA,
      ENTITY_FIELDS_DATA.AMOUNT_CRITICITY
    );
    return new ObjectStatus({
      text: {
        parts: [
          { path: `${statePath}>${name}` },
          { path: `${statePath}>${FIELDS_TREE_ACCOUNT.CURRENCY}` },
        ],
        formatter: function (amount: number, currency: string) {
          return Formatters.amount2String(amount, currency);
        },
      },
      state: {
        path: `${statePath}>${criticField}`,
        formatter: function (value: any) {
          return Conversion.criticallyToValueState(Number(value));
        },
      },
      active:
        name === FIELDS_TREE_ACCOUNT.OVERDUE_AMOUNT
          ? false
          : { path: `${statePath}>${FIELDS_TREE_INTERNAL.SHOW_POPOVER_NAV}` },
      customData: new CustomData({
        key: CUSTOM_DATA.INTERNAL_FIELD,
        value: name,
      }),
      press: (event: any) => {
        this.bankTreeViewController
          .handlerPopOverNavBankHier(statePath, event)
          .then(() => {})
          .catch(() => {});
      },
    });
  }
}
