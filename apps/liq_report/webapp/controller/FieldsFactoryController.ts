import View from "sap/ui/core/mvc/View";
import BaseStateSimple from "liqreport/state/baseStateSimple";
import AppComponent from "../Component";
import { FieldCatalogTree } from "liqreport/types/types";
import Control from "sap/ui/core/Control";
import {
  CUSTOM_DATA,
  FIELDS_TREE,
  FIELDS_TREE_ACCOUNT,
  FIELDS_TREE_INTERNAL,
  STATE_PATH,
} from "liqreport/constants/treeConstants";
import { ColumnType } from "liqreport/types/fieldCatalogTypes";
import Text from "sap/m/Text";
import Formatters from "liqreport/utils/formatters";
import { ENTITY_FIELDS_DATA } from "liqreport/constants/smartConstants";
import ObjectStatus from "sap/m/ObjectStatus";
import Conversion from "liqreport/utils/conversion";
import CustomData from "sap/ui/core/CustomData";

export default class FieldsFactoryController extends BaseStateSimple {
  protected view: View;
  constructor(
    oComponent: AppComponent,
    view: View,
  ) {
    super(oComponent);
    this.view = view;
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

    if (fieldCatalog.type === ColumnType.Amount) {
      return this.templateObjectAmount(fieldCatalog.name, statePath);
    }

    return new Text({
      text: { path: `${statePath}>${fieldCatalog.name}` },
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
    { path: `${statePath}>${FIELDS_TREE_INTERNAL.SHOW_POPOVER_NAV}` },
      customData: new CustomData({
        key: CUSTOM_DATA.INTERNAL_FIELD,
        value: name,
      }),
    });
  }
}
