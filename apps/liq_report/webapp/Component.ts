import BaseComponent from "sap/ui/core/UIComponent";
import { createDeviceModel } from "./model/models";
import { QUERY_MODEL } from "./constants/models";
import JSONModel from "sap/ui/model/json/JSONModel";
import {
  FiltersQuery,
  HierarchySelectViewModel,
  AccountDataQueryViewModel,
} from "./types/types";
import { ValueState } from "sap/ui/core/library";

import ResourceModel from "sap/ui/model/resource/ResourceModel";
import ResourceBundle from "sap/base/i18n/ResourceBundle";
import MetadataState from "./state/metadataState";
import { FILTER_DAYS } from "./constants/smartConstants";
import TableVisualizationState from "./state/tableVisualizationState";
import MessageState from "./state/messageState";
import AccountLiqItemState from "./state/accountLiqItemState";
import HierarchyLiqItemState from "./state/hierarchyLiqItemState";
import CoreConstantsState from "./coreConstants/coreConstantsState";
import ODataModel from "sap/ui/model/odata/v2/ODataModel";
import { APP_CORE_CONSTANTS } from "./coreConstants/generalConstants";

/**
 * @namespace cfwreport
 */
export default class Component extends BaseComponent {
  public static metadata = {
    manifest: "json",
  };

  public metadataState: MetadataState;
  public accountLiqItemState: AccountLiqItemState;
  public hierarchyLiqItemState: HierarchyLiqItemState;
  public coreConstantsState: CoreConstantsState;
  public queryModel: JSONModel;
  public messageModel: JSONModel;
  public tableVisualizationState: TableVisualizationState;
  public messageState: MessageState;

  /**
   * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
   * @public
   * @override
   */
  public init(): void {
    // call the base component's init function
    super.init();

    // enable routing
    this.getRouter().initialize();

    // set the device model
    this.setModel(createDeviceModel(), "device");

    this.initQueryModelData();

    // Modelo para los mensajes
    //this.setModel(Messaging.getMessageModel(), MESSAGE_MODEL);

    // Clase encargada de gestionar los metadatos del servicio
    this.metadataState = new MetadataState(this);
    // Clase encargada de gestionar visualizaciones en las tablas
    this.tableVisualizationState = new TableVisualizationState(this);
    // Clase encargada de gestionar los datos de las cuentas de posición de liquidez
    this.accountLiqItemState = new AccountLiqItemState(this);
    // Clase encargada de gestionar la jerarquía de posiciones de liquidez
    this.hierarchyLiqItemState = new HierarchyLiqItemState(this);
    // Clase encargada de gestionar los mensajes
    this.messageState = new MessageState(this);
    // Clase encargada de gestionar las constantes
    this.coreConstantsState = new CoreConstantsState(
      this.getModel() as ODataModel
    );

    this.readConstants();
  }

  /**
   * Devuelve los valores de los filtros
   */
  public getFiltersValues(): FiltersQuery {
    return this.queryModel.getProperty(
      QUERY_MODEL.FILTER_PROPERTY
    ) as FiltersQuery;
  }

  /**
   * Guarda los valores del filtro
   * @param values
   */
  public setFiltersValues(values: FiltersQuery) {
    this.queryModel.setProperty(QUERY_MODEL.FILTER_PROPERTY, values);
  }
  /**
   * Obtiene el recurso para los textos del i18n
   */
  public getI18nBundle(): ResourceBundle {
    return (
      this.getModel("i18n") as ResourceModel
    ).getResourceBundle() as ResourceBundle;
  }
  /**
   * Inicialización de los modelos internos de la aplicación
   */
  private initQueryModelData() {
    // Filtros
    this.queryModel = this.getModel(QUERY_MODEL.MODEL_NAME) as JSONModel;
    let dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - FILTER_DAYS.FROM);
    let dateTo = new Date();
    dateTo.setDate(dateTo.getDate() + FILTER_DAYS.TO);

    let initFilters: FiltersQuery = {
      company_code: [],
      displayCurrency: "",
      dateFrom: dateFrom,
      dateFromValueState: ValueState.None,
      dateFromValueStateMessage: "",
      dateTo: dateTo,
      dateToValueState: ValueState.None,
      dateToValueStateMessage: "",
    };
    this.setFiltersValues(initFilters);

    // Modelo para la vista de la consulta de datos en formato plano
    let viewModel: AccountDataQueryViewModel = { dummy: "" };
    this.queryModel.setProperty(QUERY_MODEL.ACCOUNT_DATA_VIEW_MODEL, viewModel);

    // Modelo para la vista de selección de la jerarquía
    let hierViewModel: HierarchySelectViewModel = {
      radiobuttonHierBank: false,
      inputIDBank: "",
      inputIDBankValueState: ValueState.None,
      inputIDBankValueStateText: "",
      inputIDBankPrevious: "",
      radiobuttonHierLiqItem: false,
      inputIDLiquidity: "",
      inputIDLiquidityValueState: ValueState.None,
      inputIDLiquidityValueStateText: "",
      inputIDLiquidityPrevious: "",
    };
    this.queryModel.setProperty(
      QUERY_MODEL.HIER_SELECT_VIEW_MODEL,
      hierViewModel
    );

    this.queryModel.setProperty(QUERY_MODEL.LOADING_HIER_BANK_PROCESS, false);
    this.queryModel.setProperty(QUERY_MODEL.HIERARCHY_BANK_SHOWED, false);
    this.queryModel.setProperty(QUERY_MODEL.HIERARCHY_LIQITEM_SHOWED, false);
  }
  /**
   * Lectura de las constantes necesarias para la aplicación
   */
  private readConstants() {
    // Constantes
    this.coreConstantsState
      .readConstants(APP_CORE_CONSTANTS)
      .then(() => {
        // URL de SAP
        this.coreConstantsState
          .readSAPURL()
          .then(() => {})
          .catch(() => {});
      })
      .catch(() => {});
  }
}
