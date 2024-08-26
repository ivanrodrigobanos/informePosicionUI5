import BaseController from "./Base.Controller";
import SmartFilterBar from "sap/ui/comp/smartfilterbar/SmartFilterBar";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import SmartTable from "sap/ui/comp/smarttable/SmartTable";
import Table from "sap/ui/table/Table";
import Menu from "sap/m/table/columnmenu/Menu";
import ActionItem from "sap/m/table/columnmenu/ActionItem";
import { ValueState } from "sap/ui/core/library";
import FlexBox from "sap/m/FlexBox";
import { MESSAGE_MODEL, QUERY_MODEL } from "cfwreport/constants/models";
import { ENTITY_FIELDS_DATA } from "cfwreport/constants/smartConstants";
import { FiltersQuery, HierarchySelectViewModel } from "cfwreport/types/types";
import DateFormat from "cfwreport/utils/dateFormat";
import NavContainer from "sap/m/NavContainer";
import { NAVIGATION_ID } from "cfwreport/constants/navigation";
import Control from "sap/ui/core/Control";
import Button from "sap/m/Button";
import Popover from "sap/m/Popover";
import RadioButton from "sap/m/RadioButton";
import Dialog from "sap/m/Dialog";
import View from "sap/ui/core/mvc/View";
import Item from "sap/ui/core/Item";
import MessageToast from "sap/m/MessageToast";
import ItemBase from "sap/m/table/columnmenu/ItemBase";
import Engine from "sap/m/p13n/Engine";
import CustomData from "sap/ui/core/CustomData";
import ObjectStatus from "sap/m/ObjectStatus";
import TreeTable from "sap/ui/table/TreeTable";
import Text from "sap/m/Text";
import { AccountsData } from "cfwreport/types/accountBankTypes";
import { FieldCatalogTree } from "cfwreport/types/types";
import Label from "sap/m/Label";
import Column from "sap/ui/table/Column";
import { ColumnType } from "cfwreport/types/fieldCatalogTypes";

import {
  CUSTOM_DATA,
  FIELDS_TREE,
  FIELDS_TREE_INTERNAL,
  ID_BANK_TREE_TABLE,
  PREFIX_TEXT_DISP_OPTION,
  STATE_PATH,
} from "cfwreport/constants/treeConstants";
import { FIELDS_TREE_ACCOUNT } from "cfwreport/constants/treeConstants";
import Conversion from "cfwreport/utils/conversion";
import Formatters from "cfwreport/utils/formatters";
import HierarchyBankState from "cfwreport/state/hierarchyBankState";
import { TextDisplayOption } from "cfwreport/types/hierarchyTypes";
import BankTreeViewController from "./BankTreeViewController";
import LiqItemTreeViewController from "./LiqItemTreeViewController";

/**
 * @namespace cfwreport.controller
 */
export default class Main extends BaseController {
  private _bankTreeViewController: BankTreeViewController;
  private _liqItemTreeViewController: LiqItemTreeViewController;
  private _sfb: SmartFilterBar;
  private _st: SmartTable;
  private _stInternalTable: Table;
  private _navContainter: NavContainer;
  private _popOverHierarchySelect: Popover;
  private _popOverChangeBankHier: Popover;
  private _bankTreeTable: TreeTable;
  private _popOverMessagesApp: Popover;
  private _btnShowMessageAppRaw: Button;
  private _btnShowMsgAppBankTree: Button;
  private _btnShowMsgAppLiqItemTree: Button;
  private _filterBarValuesChanged: boolean;
  private _bankTreeNodeValueColumnMenu: Menu;

  public async onInit(): Promise<void> {
    this._sfb = this.byId("SFBQuery") as SmartFilterBar;
    this._st = this.byId("SFTQuery") as SmartTable;
    this._navContainter = this.byId("navContainer") as NavContainer;
    this._bankTreeTable = this.byId("BankTreeTable") as TreeTable;

    // Inicializacion de componentes, como popover
    await this._initComponents();

    this._btnShowMessageAppRaw = this.byId("btnShowMessageAppRaw") as Button;
    this._btnShowMsgAppBankTree = this.byId("btnShowMsgAppBankTree") as Button;
    this._btnShowMsgAppLiqItemTree = this.byId(
      "btnShowMsgAppLiqItemTree"
    ) as Button;

    this.setModel(
      this.getOwnerComponent().hierarchyBankState.getModel(),
      STATE_PATH.HIERARCHY_BANK
    );
    this.setModel(
      this.getOwnerComponent().accountBankState.getModel(),
      STATE_PATH.ACCOUNT_BANK
    );
    this.setModel(
      this.getOwnerComponent().messageState.getModel(),
      MESSAGE_MODEL
    );
    this.setModel(
      this.getOwnerComponent().accountLiqItemState.getModel(),
      STATE_PATH.ACCOUNT_LIQ_ITEM
    );
    this.setModel(
      this.getOwnerComponent().hierarchyLiqItemState.getModel(),
      STATE_PATH.HIERARCHY_LIQ_ITEM
    );

    // Controla si se han modificado los valores de los filtros
    this._filterBarValuesChanged = true;

    this._bankTreeViewController = new BankTreeViewController(
      this.getOwnerComponent(),
      this.byId("BankTreeTable") as TreeTable,
      this.getView() as View
    );
    this._bankTreeViewController.initPropsTreeTable();
    this._bankTreeViewController.setPopOverMessageApp(this._popOverMessagesApp);
    this._bankTreeViewController.setBtnShowMessageApp(
      this._btnShowMsgAppBankTree
    );
    this._liqItemTreeViewController = new LiqItemTreeViewController(
      this.getOwnerComponent(),
      this.byId("LiqItemTreeTable") as TreeTable,
      this.getView() as View
    );
    this._liqItemTreeViewController.initPropsTreeTable();
  }

  /**
   * Evento cuando los filtros cambian
   */
  public onSFChange() {
    this._filterBarValuesChanged = true;

    let filterValues = this.getOwnerComponent().getFiltersValues();

    filterValues.dateToValueState = filterValues.dateFromValueState =
      ValueState.None;
    filterValues.dateToValueStateMessage =
      filterValues.dateFromValueStateMessage = "";

    // Se valida que la fecha inferior no sea superior a la superior.
    // Si alguna no esta informada la propia filterBar hara el control.
    if (filterValues.dateFrom && filterValues.dateTo) {
      if (filterValues.dateFrom > filterValues.dateTo) {
        filterValues.dateFromValueState = ValueState.Error;
        filterValues.dateFromValueStateMessage =
          "Fecha desde no puede ser superior a la fecha hasta";
      } else {
        // La diferencia de fechas no puede superar 31 días, limite de columnas del servicio.
        let diffInTime =
          DateFormat.convertUTCDateToLocalDate(filterValues.dateTo).getTime() -
          DateFormat.convertUTCDateToLocalDate(filterValues.dateFrom).getTime();
        // Se suma 1 porque del 1 de enero al 1 de Febrero da 31 días. Cuando debería ser 32, se tiene que incluir
        // el día final
        let diffInDays = Math.round(diffInTime / (1000 * 3600 * 24)) + 1;

        let numeroDiasMax = Number(
          this.getOwnerComponent().queryModel.getProperty(
            QUERY_MODEL.MAX_DAYS_BT_DATES
          )
        );

        if (diffInDays > numeroDiasMax) {
          filterValues.dateToValueState = filterValues.dateFromValueState =
            ValueState.Error;
          filterValues.dateToValueStateMessage =
            filterValues.dateFromValueStateMessage = `El número de días entre las dos fechas no puede superar los ${numeroDiasMax} días`;
        }
      }
    }

    this.getOwnerComponent().setFiltersValues(filterValues);
  }
  /**
   * Evento que se lanza antes de grabarse la variante
   */
  public onSFBeforeVariantFetch() {
    let filterValues = this.getOwnerComponent().getFiltersValues();
    this._sfb.setFilterData({ _CUSTOM: filterValues }, false);
  }
  /**
   * Evento que se lanza antes cargar la variante
   */
  public onSFVariantLoad() {
    let customData = this._sfb.getFilterData() as any;
    let filters = customData._CUSTOM as FiltersQuery;
    // Las fechas vienen en string y hay que convertirlas a fechas para que se vean correctamente
    filters.dateFrom = new Date(filters.dateFrom);
    filters.dateTo = new Date(filters.dateTo);
    this.getOwnerComponent().setFiltersValues(filters);
  }
  /**
   * Evento cuando la smarttable se inicializa
   */
  public onSTInitialised() {
    // Sitio raro para inicializar el modelo pero es aquí donde tengo el metadata
    // completamente cargado, y puedo inicializar el model con determinados datos de el.
    this.initModel();
    // Oculta las columna de valores para que no se vean de un inicio.
    this.hiddenColumnValues();
  }
  /**
   * Evento que se lanza antes del programa de búsqueda de la smartable.
   * @param event
   */
  public onBeforeRebindTable(event: any) {
    this.getOwnerComponent().messageState.clearMessage();

    // Procesos antes de la lectura de datos
    this.preAccountProcessLoadData();

    let filterValues = this.getOwnerComponent().getFiltersValues();

    // Se añaden los filtros a medida a la tabla
    let mBindingParams = event.getParameter("bindingParams");
    mBindingParams.filters.push(
      new Filter(
        "p_keydate",
        FilterOperator.EQ,
        DateFormat.convertUTCDateToLocalDate(filterValues.dateFrom)
      )
    );

    mBindingParams.filters.push(
      new Filter(
        "p_enddate",
        FilterOperator.EQ,
        DateFormat.convertUTCDateToLocalDate(filterValues.dateTo)
      )
    );
    // Se pasan todos los campos a la hora de hacer el select y obtener toda la info
    mBindingParams.parameters.select = this.buildSelectFields();

    this._st.attachEventOnce("dataReceived", (eventDataReceived: any) => {
      let modelValue: AccountsData = [];
      // Esta asignacion se guardarán más campos (campos internos del odata) que hay definido en el tipo,
      // pero me da igual, porque luego podre acceder a cada campo de manera i
      let parameters = eventDataReceived.getParameters();
      if (parameters.getParameter("data")) {
        modelValue = parameters.getParameter("data").results;

        this.getOwnerComponent().accountBankState.setAccountData(modelValue);
      } else {
        this.getOwnerComponent().messageState.AddErrorMessage(
          this.geti18nResourceBundle().getText(
            "accountDataTable.errorGetService"
          ) as string
        );
        this._popOverMessagesApp.openBy(this._btnShowMessageAppRaw);
      }
      this.postAccountProcessLoadData();
    });
  }

  /**
   * Muestra la selección de la jerarquía a visualizar
   * @param event
   */
  public async showHierarchySelect(event: any): Promise<void> {
    this.getOwnerComponent().messageState.clearMessage();

    let btnShowHierarchy = event.getSource() as Button;
    this._popOverHierarchySelect ??= await (<Promise<Popover>>this.loadFragment(
      {
        id: `${this.getView()?.getId() as string}_HierarchySelect`,
        name: "cfwreport.fragment.HierarchySelect",
      }
    ));

    this._popOverHierarchySelect.openBy(btnShowHierarchy);
  }
  /**
   * Gestiona la jerarquía seleccionada desde el popover
   * @param event
   */
  public handlerHierarchySelected() {
    let hierViewModel = this.getOwnerComponent().queryModel.getProperty(
      QUERY_MODEL.HIER_SELECT_VIEW_MODEL
    ) as HierarchySelectViewModel;

    let closePopover = false;
    let msgToastText = "";

    hierViewModel.inputIDBankValueState = ValueState.None;
    hierViewModel.inputIDBankValueStateText = "";
    hierViewModel.inputIDLiquidityValueState = ValueState.None;
    hierViewModel.inputIDLiquidityValueStateText = "";

    if (hierViewModel.inputIDBankEnabled) {
      if (hierViewModel.inputIDBank === "") {
        hierViewModel.inputIDBankValueState = ValueState.Error;
        hierViewModel.inputIDBankValueStateText =
          this.geti18nResourceBundle().getText(
            "hierarchySelect.mandatoryHier"
          ) as string;
      } else {
        if (hierViewModel.inputIDBank === hierViewModel.inputIDBankPrevious) {
          msgToastText = this.geti18nResourceBundle().getText(
            "hierarchySelect.notHierChanged"
          ) as string;
        } else {
          hierViewModel.inputIDBankPrevious = hierViewModel.inputIDBank; // Guardo el previo

          // Activamos el loader de la tabla de jerarquía
          this.getOwnerComponent().queryModel.setProperty(
            QUERY_MODEL.LOADING_HIER_BANK_PROCESS,
            true
          );

          // Si los filtros se han modificado y se navega hacia una jerarquía se realiza la misma acción que al refrescar. Es decir,
          // leer los datos de la tabla principal para poder construir la jerarquía. Si no se han modificado se hace la lectura directa
          // de los datos de jerarquía
          if (this._filterBarValuesChanged) {
            // Navegamos a la tabla de jerarquía de bancos
            this.navigateToHierarchyTree(NAVIGATION_ID.HIERARCHY_BANK);

            this.handlerRefreshData();
          } else {
            this.processBuildBankHier(hierViewModel.inputIDBank, true);
          }
        }

        closePopover = true;
      }
    }
    // Nota: Dejo los IF separados por si algun día se cambia de radiobutton a checkbox
    if (hierViewModel.inputIDLiquidityEnabled) {
      if (hierViewModel.inputIDLiquidity === "") {
        hierViewModel.inputIDLiquidityValueState = ValueState.Error;
        hierViewModel.inputIDLiquidityValueStateText =
          this.geti18nResourceBundle().getText(
            "hierarchySelect.mandatoryHier"
          ) as string;
      } else {
        if (
          hierViewModel.inputIDLiquidity ===
          hierViewModel.inputIDLiquidityPrevious
        ) {
          msgToastText = this.geti18nResourceBundle().getText(
            "hierarchySelect.notHierChanged"
          ) as string;
        } else {
          hierViewModel.inputIDLiquidityPrevious =
            hierViewModel.inputIDLiquidity; // Guardo el previo

          // Activamos el loader de la tabla de jerarquía
          this.getOwnerComponent().queryModel.setProperty(
            QUERY_MODEL.LOADING_HIER_LIQITEM_PROCESS,
            true
          );

          // Si los filtros se han modificado y se navega hacia una jerarquía se realiza la misma acción que al refrescar. Es decir,
          // leer los datos de la tabla principal para poder construir la jerarquía. Si no se han modificado se hace la lectura directa
          // de los datos de jerarquía
          if (this._filterBarValuesChanged) {
            // Navegamos a la tabla de jerarquía de bancos
            this.navigateToHierarchyTree(NAVIGATION_ID.HIERARCHY_LIQ_ITEM);

            this.handlerRefreshData();
          } else {
            this.processBuildLiqItemHier(hierViewModel.inputIDLiquidity, true);
          }
        }

        closePopover = true;
      }
    }

    if (
      !hierViewModel.inputIDLiquidityEnabled &&
      !hierViewModel.inputIDBankEnabled
    ) {
      msgToastText = this.geti18nResourceBundle().getText(
        "hierarchySelect.noHierSelected"
      ) as string;
    }

    this.getOwnerComponent().queryModel.setProperty(
      QUERY_MODEL.HIER_SELECT_VIEW_MODEL,
      hierViewModel
    );

    if (closePopover) {
      if (this._popOverHierarchySelect) this._popOverHierarchySelect.close();
      if (this._popOverChangeBankHier) this._popOverChangeBankHier.close();
    }

    if (msgToastText !== "") MessageToast.show(msgToastText);
  }
  /**
   * Gestiona el loading de la lectura de jerarquias en el combo
   * @param event
   */
  public handlerLoadHierDir(event: any) {
    // Al inicio de la carga se asocia la función para que se puede filtrar por patron
    event.getSource().setFilterFunction((sTerm: string, oItem: Item): any => {
      return (
        oItem.getText().match(new RegExp(sTerm, "i")) ||
        oItem.getKey().match(new RegExp(sTerm, "i"))
      );
    });
    event.getSource().getBinding("items").resume();
  }

  /**
   * Proceso de construcción de la jerarquía de bancos
   * @param IDHierarchy Id de jerarquía
   * @param navigate Navega a la vista de jerarquía
   */
  public processBuildBankHier(IDHierarchy: string, navigate: boolean) {
    this.getOwnerComponent().messageState.clearMessage();

    this._bankTreeViewController.processBuildBankHier(
      IDHierarchy,
      this._filterBarValuesChanged,
      () => {},
      () => {
        this._popOverMessagesApp.openBy(this._btnShowMsgAppBankTree);
      }
    );

    if (navigate) this.navigateToHierarchyTree(NAVIGATION_ID.HIERARCHY_BANK);
  }
  /**
   * Proceso de construcción de la jerarquía de posiciones de liquidez
   * @param IDHierarchy Id de jerarquía
   * @param navigate Navega a la vista de jerarquía
   */
  public processBuildLiqItemHier(IDHierarchy: string, navigate: boolean) {
    this.getOwnerComponent().messageState.clearMessage();

    this._liqItemTreeViewController.processBuildHier(
      IDHierarchy,
      this._filterBarValuesChanged,
      () => {},
      () => {
        this._popOverMessagesApp.openBy(this._btnShowMsgAppLiqItemTree);
      }
    );

    if (navigate)
      this.navigateToHierarchyTree(NAVIGATION_ID.HIERARCHY_LIQ_ITEM);
  }
  /**
   * Cierra un dialogo
   * @param event
   */
  public closeDialog(event: any) {
    (event.getSource() as Dialog).close();
  }
  /**
   * Gestiona el cambio de radiobutton
   * @param event
   */
  public handlerSelectHierarchy(event: any) {
    let viewModel = this.getOwnerComponent().queryModel.getProperty(
      QUERY_MODEL.HIER_SELECT_VIEW_MODEL
    ) as HierarchySelectViewModel;
    // Se pone que los input no son editables a expensas de saber cual ha sido el seleccionado
    viewModel.inputIDBankEnabled = false;
    viewModel.inputIDLiquidityEnabled = false;

    let radioButton = event.getSource() as RadioButton;
    // Radiobutton de jerarquía de banco seleccionado
    if (
      radioButton.getId().indexOf("BankHierarchy") !== -1 &&
      radioButton.getSelected()
    ) {
      viewModel.inputIDBankEnabled = true;
      // Se quita el valor de los ID seleccionados en otras jerarquías
      viewModel.inputIDLiquidity = "";
    }
    // Radiobutton de jerarquía de liquidez seleccionado
    else if (
      radioButton.getId().indexOf("LiquidityHierarchy") !== -1 &&
      radioButton.getSelected()
    ) {
      viewModel.inputIDLiquidityEnabled = true;
      // Se quita el valor de los ID seleccionados en otras jerarquías
      viewModel.inputIDBank = "";
    }

    this.getOwnerComponent().queryModel.setProperty(
      QUERY_MODEL.HIER_SELECT_VIEW_MODEL,
      viewModel
    );
  }
  /**
   * Navega a la pagina que muestra la jerarquía de bancos
   */
  public navigateToHierarchyTree(id: string) {
    this._navContainter.to(this.byId(id) as Control);
  }
  /**
   * Navega al informe de cuentas
   */
  public navigationAccountQuery() {
    this._navContainter.to(this.byId(NAVIGATION_ID.ACCOUNT_QUERY) as Control);
  }
  /**
   * Navega a la jerarquía de bancos
   */
  public handlerGoHierarchyBank() {
    this._navContainter.to(this.byId(NAVIGATION_ID.HIERARCHY_BANK) as Control);
  }
  /**
   * Naviga hacía la página anterior
   */
  public navigationBack() {
    this._navContainter.back();
  }
  /**
   * Gestiona el cambio de jerarquía de banco
   */
  public async handlerChangeBankHier(event: any) {
    let btnShowHierarchy = event.getSource() as Button;
    this._popOverChangeBankHier ??= await (<Promise<Popover>>this.loadFragment({
      id: this.getView()?.getId() as string,
      name: "cfwreport.fragment.hierarchyBank.ChangeBankHier",
    }));

    this._popOverChangeBankHier.openBy(btnShowHierarchy);
  }
  /**
   * Construye las columnas
   * @param sId
   * @param oContext
   * @returns
   */
  public factoryHierarchyFieldCatalog(sId: string, oContext: any) {
    let fieldCatalog: Partial<FieldCatalogTree> = {};
    let statePath = "";
    if (sId.includes(ID_BANK_TREE_TABLE)) {
      fieldCatalog = this.getOwnerComponent()
        .hierarchyBankState.getModel()
        .getProperty(oContext.sPath as string) as FieldCatalogTree;

      statePath = STATE_PATH.HIERARCHY_BANK;
    }

    return new Column(sId, {
      id: fieldCatalog?.name,
      visible: fieldCatalog.visible,
      width: fieldCatalog.width,
      label: new Label({
        text: fieldCatalog.label,
      }),
      hAlign: fieldCatalog.hAlign,
      template: this.getTemplateObjectforTableColumn(
        fieldCatalog as FieldCatalogTree,
        statePath
      ),
      customData: new CustomData({
        key: CUSTOM_DATA.INTERNAL_FIELD,
        value: fieldCatalog.name,
      }),
    });
  }
  /**
   * Muestra los mensajes de aplicación desde las vistas
   * @param event
   */
  public onShowMessageApp(event: any) {
    this._popOverMessagesApp.openBy(event.getSource() as Button);
  }

  /**
   * Expande el primer nivel del arbol
   */
  public handlerTreeExpandFirstLevel(event: any) {
    let treeTable = event.getSource().getParent().getParent() as TreeTable;
    treeTable.expandToLevel(1);
  }
  /**
   * Expande los niveles seleccionados
   */
  public handlerTreeExpandSelection(event: any) {
    // Source es el botón, su padre la toolbar, y el padre del toolbar la treeTable
    let treeTable = event.getSource().getParent().getParent() as TreeTable;
    treeTable.expand(treeTable.getSelectedIndices());
  }
  /**
   * Contrae todo
   */
  public handlerTreeCollapseAll(event: any) {
    let treeTable = event.getSource().getParent().getParent() as TreeTable;
    treeTable.collapseAll();
  }
  /**
   * Contrae los niveles seleccionados
   */
  public handlerTreeCollapseSelection(event: any) {
    let treeTable = event.getSource().getParent().getParent() as TreeTable;
    treeTable.collapse(treeTable.getSelectedIndices());
  }
  /**
   * Gestiona el refresco manual de datos
   */
  public handlerRefreshData() {
    // Se lanza el proceso de lectura de datos de la smartable
    this._st.rebindTable(true);
  }

  /**
   * Gestiona la configuración del tree tabla de bancos
   */
  public async handlerTablePersonalization(event: any) {
    await Engine.getInstance().show(
      event.getSource().getParent().getParent() as Control,
      ["Columns"],
      {
        source: event.getSource(),
      }
    );
  }
  /**
   * Gestiona el evento del menu contextual de la tabla
   * @param event
   */
  public handlerTreeTableRowsUpdated() {
    // Asociar el menu contextual a un campo de la tree table se tiene que hacer cuando se actualice las columnas ya que es una
    // tabla dinámica y las columnas se crean a través de una factory. Pero hay que tener en cuenta que este método se llama varias
    // veces y por eso hay que tener en cuenta para que solo se asocie una vez para evitar problemas de rendimiento.
    if (!this._bankTreeNodeValueColumnMenu)
      this._bankTreeNodeValueColumnMenu =
        this.associateColumnTreeContextualMenu(
          FIELDS_TREE.NODE,
          this.getOwnerComponent().hierarchyBankState,
          this._bankTreeTable
        ) as Menu;
  }

  /**
   * Devuelve la clave el id interno de un objeto
   * @param oControl
   * @returns
   */
  private getKey(oControl: any) {
    return (this.getView() as View).getLocalId(oControl.getId() as string);
  }
  /**
   * Procesos que se realizan antes de buscar datos desde los dos sitios:
   * Botón "Ir" de la smartfilterbar y botón refrescar en la toolbar de las dos tablas
   */
  private preAccountProcessLoadData() {
    let hierViewModel = this.getOwnerComponent().queryModel.getProperty(
      QUERY_MODEL.HIER_SELECT_VIEW_MODEL
    ) as HierarchySelectViewModel;

    // Actualizo los filtros internos(sociedad o moneda) en el modelo de filtros.
    this.updateInternalFilterModel();
    // Solo si los filtros cambian se limpia el modelo, de esta manera no hay refrescos innecesarios en la tabla
    if (this._filterBarValuesChanged) {
      this.getOwnerComponent().accountBankState.clearModelValue();
      this.getOwnerComponent().hierarchyBankState.clearModelValue();
      this.getOwnerComponent().hierarchyLiqItemState.clearModelValue();
    }

    // Pone los loader de los treeTable
    this.setLoadingStateHierTree(true);

    // Nota: La obtención de datos para la posición de liquidez se hace aquí porque la búsqueda de datos para construir la jerarquía
    // no depende de la smartable. Y de esta manera se hacen procesos en paralelo ganando en velocidad.
    if (hierViewModel.inputIDLiquidityEnabled)
      this.processBuildLiqItemHier(hierViewModel.inputIDLiquidity, false);
  }
  /**
   * Post proceso después de la carga de datos de cuentas
   */
  private postAccountProcessLoadData() {
    // Si no hay datos puede ser por dos motivos 1) No ha encontrado datos con los filtros introducidos
    // 2) Que el servicio haya dado un error.
    // En ambos casos hay que:
    // 1) desactivar el loading(puede ser que no este activo si no se ha seleccionado jerarquía)
    // 2) Limpia el modo de datos de la jerarquía
    if (this.getOwnerComponent().accountBankState.getAccountData().length > 0) {
      // Se muestran las columnas de valore según los filtros en la smartable
      this.showColumnValues();

      let hierViewModel = this.getOwnerComponent().queryModel.getProperty(
        QUERY_MODEL.HIER_SELECT_VIEW_MODEL
      ) as HierarchySelectViewModel;

      // Nota: Dejo montado para que se busque ambas jerarquías por si en un futuro se quiere tener dicha funcionalidad.
      if (hierViewModel.inputIDBankEnabled)
        this.processBuildBankHier(hierViewModel.inputIDBank, false);

      // Nota2: La obtención de datos para la posición de liquidez se hace en el método "preAccountProcess..." el motivo es que las búsquedas
      // de datos son distintas a la de la smartable, y no tiene sentido esperarse a que termine la búsqueda para comenzar esta.
    } else {
      this.setLoadingStateHierTree(false);

      this.getOwnerComponent().hierarchyBankState.clearModelValue();
      this.getOwnerComponent().hierarchyLiqItemState.clearModelValue();
    }

    // Se indica que los filtros no han cambiado una vez obtenido todos los valores
    this._filterBarValuesChanged = false;
  }
  /**
   * Establece el loader en los treeTable según el tipo de jerarquía que se este visualizando
   * @param loading
   */
  private setLoadingStateHierTree(loading: boolean) {
    let hierViewModel = this.getOwnerComponent().queryModel.getProperty(
      QUERY_MODEL.HIER_SELECT_VIEW_MODEL
    ) as HierarchySelectViewModel;

    if (
      hierViewModel.inputIDBankEnabled &&
      (this.getOwnerComponent().queryModel.getProperty(
        QUERY_MODEL.HIERARCHY_BANK_SHOWED
      ) as boolean)
    )
      this.getOwnerComponent().queryModel.setProperty(
        QUERY_MODEL.LOADING_HIER_BANK_PROCESS,
        loading
      );

    if (
      hierViewModel.inputIDLiquidityEnabled &&
      (this.getOwnerComponent().queryModel.getProperty(
        QUERY_MODEL.HIERARCHY_LIQITEM_SHOWED
      ) as boolean)
    )
      this.getOwnerComponent().queryModel.setProperty(
        QUERY_MODEL.LOADING_HIER_LIQITEM_PROCESS,
        loading
      );
  }
  /**
   * Devuevle el control donde se pinta el valor en las tablas dinámicas
   * en base a la configuración del campo
   * @param fieldCatalog Datos del catalogo de campo
   * @param statePath Path de acceso al modelo de datos
   * @returns
   */
  private getTemplateObjectforTableColumn(
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
          tooltip: this.getOwnerComponent()
            .getI18nBundle()
            .getText("bankAccountTree.btnDetailPlv"),
          visible: {
            path: `${statePath}>${FIELDS_TREE_INTERNAL.SHOW_BTN_DETAIL}`,
          },
          press(oEvent: any) {
            let oRow = oEvent.getSource().getParent();

            if (statePath === STATE_PATH.HIERARCHY_BANK) {
              that._bankTreeViewController.processAddPlanningLevelData([
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
                that
                  .getOwnerComponent()
                  .tableVisualizationState.getDisplayTypeFieldText(name)
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
   * Construye los campos que se pasarán a la consulta del servicio. Son los campos que se pasan en
   * el parámetro de la URL "select"
   * @returns
   */
  private buildSelectFields(): string {
    let selectFields = "";
    let entityFields =
      this.getOwnerComponent().metadataState.getFieldsEntitySet();
    if (Array.isArray(entityFields)) {
      entityFields.forEach((row) => {
        if (selectFields === "") selectFields = row.name;
        else selectFields += `,${row.name}`;
      });
    }

    return selectFields;
  }
  /**
   * Muestras las columnas en base a los valores recuperados
   * @param queryValues
   */
  private showColumnValues(): void {
    if (this.getOwnerComponent().accountBankState.getAccountData().length > 0) {
      let initialRowQuery =
        this.getOwnerComponent().accountBankState.getAccountData()[0];
      let tableColumns = this._stInternalTable.getColumns();

      // Columna de overdue
      let overdueColumn = tableColumns.find(
        (column) =>
          column.getId().indexOf(ENTITY_FIELDS_DATA.OVERDUE_AMOUNT) !== -1
      );
      if (overdueColumn)
        overdueColumn.setVisible(
          this.getOwnerComponent().accountBankState.checkOverdueColumnWithValues()
        );

      this.getOwnerComponent()
        .metadataState.getAmountFields()
        .forEach((amountField) => {
          // Obtenemos el campo de la etiqueta que tendrá el campo de importe
          let labelField = amountField.replace(
            ENTITY_FIELDS_DATA.AMOUNT_DATA,
            ENTITY_FIELDS_DATA.AMOUNT_LABEL
          );

          // Para saber que columnas tiene que visualizar tomo como referencia el valor del campo de la etiqueta, ya que
          // si esta informada es que se tiene que pintar, aunque no haya importe. Para saber eso tomo el primer registro de datos
          let tableColumn = tableColumns.find(
            (column) => column.getId().indexOf(amountField) !== -1
          );

          if (tableColumn) {
            let labelValue = initialRowQuery[labelField];
            if (labelValue === "") {
              tableColumn.setVisible(false);
            } else {
              tableColumn.setVisible(true);
              tableColumn.setLabel(labelValue as string);
            }
          }
        });
    }
  }
  /**
   * Oculta las columnas de valores
   */
  private hiddenColumnValues() {
    let columns = this._stInternalTable.getColumns();

    columns
      .filter(
        (column) =>
          column.getId().indexOf(ENTITY_FIELDS_DATA.AMOUNT_DATA) !== -1
      )
      .forEach((column) => {
        column.setVisible(false);
      });
  }
  /**
   * Inicialización de modelos globales o propios
   */
  private initModel() {
    let numberAmountFields =
      this.getOwnerComponent().metadataState.getNumberAmountFields();

    // Se guarda el numero de campos de importe. Ese numero se usará, por ejemplo,
    // para que el intervalo de fechas no supere el numero de campos de cantidad.
    this.getOwnerComponent().queryModel.setProperty(
      QUERY_MODEL.MAX_DAYS_BT_DATES,
      numberAmountFields
    );
    let fields = "";
    this.getOwnerComponent()
      .metadataState.getAmountFields()
      .forEach((field) => {
        if (field === "") fields = field;
        else fields += `,${field}`;
      });
    this._st.setIgnoredFields(fields);

    // Se obtiene la instancia de la tabla asociada a la smartable para poder ajustar valores que no se puede hacer directamente a la smartable.
    this._stInternalTable = this.byId(`${this._st.getId()}-ui5table`) as Table;
    this._stInternalTable.setFixedColumnCount(1);

    // Apaño para forzar que se lean todos los registros de golpe. Ya
    // que los datos se pivotan de filas a columnas. Con lo cual no puede haber paginación
    // porque tanto se pivote en origen o en destino(que es como lo hacemos ahora) el problema estará igual.
    this._stInternalTable.setThreshold(40000);
  }
  /**
   * Asocia a un menu contextual a un columna de una tabla
   * @param fieldname Nombre del campo
   * @param state estado que gestiona los datos del campo
   * @param oTable Tabla donde esta la columna
   */
  private associateColumnTreeContextualMenu(
    fieldname: string,
    state: HierarchyBankState,
    oTable: TreeTable
  ): Menu | null {
    let idColumn = this.getIdColumnFromState(state, fieldname);

    // Solo se crea el menu, y se asocia, cuando se tenga el ID de la columna exista en la tabla.
    if (idColumn !== "") {
      let textItems = this.buildColumnMenuTextDisplayOptions(
        state,
        FIELDS_TREE.NODE,
        oTable
      );
      let contextualMenu = new Menu({
        items: textItems,
      });

      (this.byId(idColumn) as Column).setHeaderMenu(contextualMenu.getId());
      return contextualMenu;
    }
    return null;
  }
  /**
   * Construye las opciones del menu de opciones de visualizacion del texto
   * @param state estado que gestiona los datos del campo
   * @param fieldname nombre del campo
   * @param oTable Tabla donde esta el campo
   * @returns
   */
  private buildColumnMenuTextDisplayOptions(
    state: HierarchyBankState,
    fieldname: string,
    oTable: TreeTable
  ): ItemBase[] {
    return [
      new ActionItem({
        id: `${PREFIX_TEXT_DISP_OPTION}${fieldname}_KEY`,
        icon:
          this.getOwnerComponent().tableVisualizationState.getDisplayTypeFieldText(
            fieldname
          ) === TextDisplayOption.Key
            ? "sap-icon://accept"
            : undefined,
        label: this.getOwnerComponent()
          .getI18nBundle()
          .getText("menuTextDisplayOptionKey"),
        press: (event: any) => {
          if (
            this.getOwnerComponent().tableVisualizationState.getDisplayTypeFieldText(
              fieldname
            ) !== TextDisplayOption.Key
          )
            this.pressMenuOptionTextDisplay(
              state,
              oTable,
              this._bankTreeNodeValueColumnMenu,
              fieldname,
              TextDisplayOption.Key,
              event.getParameter("id") as string
            );
        },
      }),
      new ActionItem({
        id: `${PREFIX_TEXT_DISP_OPTION}${fieldname}_TEXT`,
        icon:
          this.getOwnerComponent().tableVisualizationState.getDisplayTypeFieldText(
            fieldname
          ) === TextDisplayOption.Text
            ? "sap-icon://accept"
            : undefined,
        label: this.getOwnerComponent()
          .getI18nBundle()
          .getText("menuTextDisplayOptionText"),
        press: (event: any) => {
          if (
            this.getOwnerComponent().tableVisualizationState.getDisplayTypeFieldText(
              fieldname
            ) !== TextDisplayOption.Text
          )
            this.pressMenuOptionTextDisplay(
              state,
              oTable,
              this._bankTreeNodeValueColumnMenu,
              fieldname,
              TextDisplayOption.Text,
              event.getParameter("id") as string
            );
        },
      }),
      new ActionItem({
        id: `${PREFIX_TEXT_DISP_OPTION}${fieldname}_TEXTKEY`,
        icon:
          this.getOwnerComponent().tableVisualizationState.getDisplayTypeFieldText(
            fieldname
          ) === TextDisplayOption.TextKey
            ? "sap-icon://accept"
            : undefined,
        label: this.getOwnerComponent()
          .getI18nBundle()
          .getText("menuTextDisplayOptionTextKey"),
        press: (event: any) => {
          if (
            this.getOwnerComponent().tableVisualizationState.getDisplayTypeFieldText(
              fieldname
            ) !== TextDisplayOption.TextKey
          )
            this.pressMenuOptionTextDisplay(
              state,
              oTable,
              this._bankTreeNodeValueColumnMenu,
              fieldname,
              TextDisplayOption.TextKey,
              event.getParameter("id") as string
            );
        },
      }),
    ];
  }
  /**
   * Pasos cuando se pulsa una opción del menú del cambio de tipo de visualización
   * de un campo de texto
   * @param state estado que gestiona los datos del campo
   * @param oTable Tabla
   * @param columnMenu Menu contextual del menu
   * @param fieldname Nombre del campo
   * @param option Opción seleccionada
   * @param optionIdSelected ID de le menú seleccionado
   */
  private pressMenuOptionTextDisplay(
    state: HierarchyBankState,
    oTable: TreeTable,
    columnMenu: Menu,
    fieldname: string,
    option: TextDisplayOption,
    optionIdSelected: string
  ) {
    // Cambio del tipo de visualización del campo
    this.getOwnerComponent().tableVisualizationState.setDisplayTypeFieldText(
      fieldname,
      option
    );
    // Actualiza el icono en el menu
    this.updateIconNodeValueColumnMenu(
      columnMenu,
      optionIdSelected,
      PREFIX_TEXT_DISP_OPTION
    );
    // Fuerza el refresco total de datos, esto hace que entre en los formatters.
    oTable.getBinding("rows").getModel()?.refresh(true);

    let idColumn = this.getIdColumnFromState(state, fieldname);
    (this.byId(idColumn) as Column).setHeaderMenu(columnMenu.getId());

    // El refresco que se hace a la tabla hace que la personalización se pierda. Este método
    // lo vuelve a dejar como estaba.
    this._bankTreeViewController.applyPersonalizationUpdateTable();
  }
  /**
   * Recupera el Id interno del treetable a partir del nombre de campo y el state
   * que gestiona sus datos
   * @param state State que gestiona los procesos
   * @param fieldname Nombre del campo
   * @returns
   */
  private getIdColumnFromState(state: HierarchyBankState, fieldname: string) {
    return state.getColumnIdTreeTable(fieldname);
  }
  /**
   * Actualiza el icono de las opciones del menu de la columna
   * @param columnMenu Objeto con el menu
   * @param optionIdSelected id del elemento pulsado
   * @param prefixID prefijo que agrupa las opciones de menu
   */
  private updateIconNodeValueColumnMenu(
    columnMenu: Menu,
    optionIdSelected: string,
    prefixID: string
  ) {
    columnMenu
      .getItems()
      .filter((item) => item.getId().includes(prefixID))
      .forEach((item: any) => {
        if (item.getId() === optionIdSelected)
          item.setIcon("sap-icon://accept");
        else item.setIcon("");
      });
  }
  /**
   * Inicialización de componentes
   */
  private async _initComponents() {
    this._popOverMessagesApp ??= await (<Promise<Popover>>this.loadFragment({
      id: this.getView()?.getId() as string,
      name: "cfwreport.fragment.MessageApp",
    }));
  }
  /**
   * Informo los filtros internos de la smartfilterbar al modelo propio de filtros.
   * Los filtros internos son los de sociedad o moneda, que los gestiona internamente la smartfilterbar
   *
   */
  private updateInternalFilterModel() {
    let filterValues = this.getOwnerComponent().getFiltersValues();

    let internalValues = this._sfb.getFilterData() as any;
    filterValues.displayCurrency = internalValues.p_displaycurrency;
    filterValues.company_code = [];
    if (internalValues.company_code)
      internalValues.company_code.items.forEach((item: any) => {
        filterValues.company_code.push(item.key as string);
      });

    this.getOwnerComponent().setFiltersValues(filterValues);
  }
}
