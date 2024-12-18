import BaseController from "./Base.Controller";
import SmartFilterBar from "sap/ui/comp/smartfilterbar/SmartFilterBar";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import SmartTable from "sap/ui/comp/smarttable/SmartTable";
import Table from "sap/ui/table/Table";
import Menu from "sap/m/table/columnmenu/Menu";
import ActionItem from "sap/m/table/columnmenu/ActionItem";
import { ValueState } from "sap/ui/core/library";
import { MESSAGE_MODEL, QUERY_MODEL } from "liqreport/constants/models";
import { ENTITY_FIELDS_DATA } from "liqreport/constants/smartConstants";
import { FiltersQuery, HierarchySelectViewModel } from "liqreport/types/types";
import DateFormat from "liqreport/utils/dateFormat";
import NavContainer from "sap/m/NavContainer";
import { NAVIGATION_ID } from "liqreport/constants/navigation";
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
import TreeTable from "sap/ui/table/TreeTable";
import { AccountsData } from "liqreport/types/accountBankTypes";
import { FieldCatalogTree } from "liqreport/types/types";
import Label from "sap/m/Label";
import Column from "sap/ui/table/Column";

import {
  CUSTOM_DATA,
  FIELDS_TREE,
  ID_LIQITEM_TREE_TABLE,
  PATH_NAVIGATION_MODEL,
  PREFIX_TEXT_DISP_OPTION,
  STATE_PATH,
} from "liqreport/constants/treeConstants";
import { TextDisplayOption } from "liqreport/types/hierarchyTypes";
import LiqItemTreeViewController from "./LiqItemTreeViewController";
import HierarchyLiqItemState from "liqreport/state/hierarchyLiqItemState";
import formatter from "../model/formatter";
import FieldsFactoryController from "./FieldsFactoryController";

/**
 * @namespace liqreport.controller
 */
export default class Main extends BaseController {
  private _liqItemTreeViewController: LiqItemTreeViewController;
  private _sfb: SmartFilterBar;
  private _st: SmartTable;
  private _stInternalTable: Table;
  public navContainer: NavContainer;
  private _popOverHierarchySelect: Popover;
  private _popOverChangeBankHier: Popover;
  private _popOverChangeLiqItemHier: Popover;
  private _bankTreeTable: TreeTable;
  private _liqItemTreeTable: TreeTable;
  private _popOverMessagesApp: Popover;
  private _btnShowMessageAppRaw: Button;
  private _btnShowMsgAppBankTree: Button;
  private _btnShowMsgAppLiqItemTree: Button;
  private _filterBarValuesChanged: boolean;
  private _bankTreeNodeValueColumnMenu: Menu;
  private _liqItemTreeNodeValueColumnMenu: Menu;
  private fieldsFactory: FieldsFactoryController;
  public formatter = formatter;

  public onInit() {
    this._sfb = this.byId("SFBQuery") as SmartFilterBar;
    this._st = this.byId("SFTQuery") as SmartTable;
    this.navContainer = this.byId("navContainer") as NavContainer;
    this._bankTreeTable = this.byId("BankTreeTable") as TreeTable;
    this._liqItemTreeTable = this.byId("LiqItemTreeTable") as TreeTable;

    // Inicializacion de componentes, como popover
     this._initComponents();

    this._btnShowMessageAppRaw = this.byId("btnShowMessageAppRaw") as Button;
    this._btnShowMsgAppBankTree = this.byId("btnShowMsgAppBankTree") as Button;
    this._btnShowMsgAppLiqItemTree = this.byId(
      "btnShowMsgAppLiqItemTree"
    ) as Button;


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

    this._liqItemTreeViewController = new LiqItemTreeViewController(
      this.getOwnerComponent(),
      this.byId("LiqItemTreeTable") as TreeTable,
      this.getView() as View
    );
    this._liqItemTreeViewController.initPropsTreeTable();
    // this.fieldsFactory = new FieldsFactoryController(
    //   this.getOwnerComponent(),
    //   this.getView() as View,
    //   this._bankTreeViewController
    // );
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
          this.geti18nResourceBundle().getText(
            "filterbar.DateHighLow"
          ) as string;
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
            filterValues.dateFromValueStateMessage =
              this.geti18nResourceBundle().getText(
                "filterbar.MaxIntervalDays",
                [numeroDiasMax]
              ) as string;
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
      } else {
        this.getOwnerComponent().messageState.AddErrorMessage(
          this.geti18nResourceBundle().getText(
            "accountDataTable.errorGetService"
          ) as string
        );
        this._popOverMessagesApp.openBy(this._btnShowMessageAppRaw);
      }
      // this.postAccountProcessLoadData(); //LO DEJO COMENTADO PORQUE EL MÉTODO TB LO ESTÁ
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
        name: "liqreport.fragment.HierarchySelect",
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

    let closePopoverBank = false;
    let closePopoverLiqItem = false;

    if (hierViewModel.radiobuttonHierBank)
      closePopoverBank = this.handlerHierBankSelected();

    if (hierViewModel.radiobuttonHierLiqItem)
      closePopoverLiqItem = this.handlerHierLiqItemSelected();

    if (
      !hierViewModel.radiobuttonHierLiqItem &&
      !hierViewModel.radiobuttonHierBank
    )
      MessageToast.show(
        this.geti18nResourceBundle().getText(
          "hierarchySelect.noHierSelected"
        ) as string
      );

    if (
      (closePopoverBank || closePopoverLiqItem) &&
      this._popOverHierarchySelect
    )
      this._popOverHierarchySelect.close();
  }
  /**
   * Proceso que gestiona la selección de la jerarquia de bancos ya sea
   * desde el selector principal o cuando se cambia la jerarquía
   */
  public handlerHierBankSelected(): boolean {
    let hierViewModel = this.getOwnerComponent().queryModel.getProperty(
      QUERY_MODEL.HIER_SELECT_VIEW_MODEL
    ) as HierarchySelectViewModel;

    let closePopover = false;
    let msgToastText = "";

    hierViewModel.inputIDBankValueState = ValueState.None;
    hierViewModel.inputIDBankValueStateText = "";

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
          this.handlerGoHierarchyBank(); // Navegamos a la tabla de jerarquía de bancos

          this.handlerRefreshData();
        } else {
          this.processBuildBankHier(hierViewModel.inputIDBank, true);
        }
      }

      closePopover = true;
    }

    this.getOwnerComponent().queryModel.setProperty(
      QUERY_MODEL.HIER_SELECT_VIEW_MODEL,
      hierViewModel
    );

    if (closePopover && this._popOverChangeBankHier)
      this._popOverChangeBankHier.close();

    if (msgToastText !== "") MessageToast.show(msgToastText);

    return closePopover;
  }
  /**
   * Proceso que gestiona la selección de la jerarquia de posiciones de liquidez ya sea
   * desde el selector principal o cuando se cambia la jerarquía
   */
  public handlerHierLiqItemSelected(): boolean {
    let hierViewModel = this.getOwnerComponent().queryModel.getProperty(
      QUERY_MODEL.HIER_SELECT_VIEW_MODEL
    ) as HierarchySelectViewModel;

    let closePopover = false;
    let msgToastText = "";

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
        hierViewModel.inputIDLiquidityPrevious = hierViewModel.inputIDLiquidity; // Guardo el previo

        // Activamos el loader de la tabla de jerarquía
        this.getOwnerComponent().queryModel.setProperty(
          QUERY_MODEL.LOADING_HIER_LIQITEM_PROCESS,
          true
        );

        // Si los filtros se han modificado y se navega hacia una jerarquía se realiza la misma acción que al refrescar. Es decir,
        // leer los datos de la tabla principal para poder construir la jerarquía. Si no se han modificado se hace la lectura directa
        // de los datos de jerarquía
        if (this._filterBarValuesChanged) {
          this.handlerGoHierarchyLiqItem(); // Navegamos a la tabla de jerarquía de posiciones de liquidez;
          this.handlerRefreshData();
        } else {
          this.processBuildLiqItemHier(hierViewModel.inputIDLiquidity, true);
        }
      }

      closePopover = true;
    }

    hierViewModel.inputIDLiquidityValueState = ValueState.None;
    hierViewModel.inputIDLiquidityValueStateText = "";

    this.getOwnerComponent().queryModel.setProperty(
      QUERY_MODEL.HIER_SELECT_VIEW_MODEL,
      hierViewModel
    );

    if (closePopover && this._popOverChangeLiqItemHier)
      this._popOverChangeLiqItemHier.close();

    if (msgToastText !== "") MessageToast.show(msgToastText);

    return closePopover;
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

    // this._bankTreeViewController.processBuildBankHier(
    //   IDHierarchy,
    //   this._filterBarValuesChanged,
    //   () => {},
    //   () => {
    //     this._popOverMessagesApp.openBy(this._btnShowMsgAppBankTree);
    //   }
    // );

    if (navigate) this.handlerGoHierarchyBank();
  }
  /**
   * Proceso de construcción de la jerarquía de posiciones de liquidez
   * @param IDHierarchy Id de jerarquía
   * @param navigate Navega a la vista de jerarquía
   */
  public processBuildLiqItemHier(IDHierarchy: string, navigate: boolean) {
    this.getOwnerComponent().messageState.clearMessage();

    this._liqItemTreeViewController.processBuildHierarchy(
      IDHierarchy,
      this._filterBarValuesChanged,
      () => {},
      () => {
        this._popOverMessagesApp.openBy(this._btnShowMsgAppLiqItemTree);
      }
    );

    if (navigate) this.handlerGoHierarchyLiqItem();
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
    viewModel.radiobuttonHierBank = false;
    viewModel.radiobuttonHierLiqItem = false;

    let radioButton = event.getSource() as RadioButton;
    // Radiobutton de jerarquía de banco seleccionado
    if (
      radioButton.getId().indexOf("BankHierarchy") !== -1 &&
      radioButton.getSelected()
    ) {
      viewModel.radiobuttonHierBank = true;
      // Se quita el valor de los ID seleccionados en otras jerarquías, si no se ha mostrado previamente sus valores
      if (
        !this.getOwnerComponent().queryModel.getProperty(
          QUERY_MODEL.HIERARCHY_LIQITEM_SHOWED
        )
      )
        viewModel.inputIDLiquidity = "";
    }
    // Radiobutton de jerarquía de liquidez seleccionado
    else if (
      radioButton.getId().indexOf("LiquidityHierarchy") !== -1 &&
      radioButton.getSelected()
    ) {
      viewModel.radiobuttonHierLiqItem = true;
      // Se quita el valor de los ID seleccionados en otras jerarquías
      if (
        !this.getOwnerComponent().queryModel.getProperty(
          QUERY_MODEL.HIERARCHY_BANK_SHOWED
        )
      )
        viewModel.inputIDBank = "";
    }

    this.getOwnerComponent().queryModel.setProperty(
      QUERY_MODEL.HIER_SELECT_VIEW_MODEL,
      viewModel
    );
  }

  /**
   * Navega al informe de cuentas
   */
  public handlerGoAccountQuery() {
    this.navContainer.to(this.byId(NAVIGATION_ID.ACCOUNT_QUERY) as Control);
  }
  /**
   * Navega a la jerarquía de bancos
   */
  public handlerGoHierarchyBank() {
    this.navContainer.to(this.byId(NAVIGATION_ID.HIERARCHY_BANK) as Control);
  }
  /**
   * Navega a la jerarquía de posiciones de liquidez
   */
  public handlerGoHierarchyLiqItem() {
    this.navContainer.to(
      this.byId(NAVIGATION_ID.HIERARCHY_LIQ_ITEM) as Control
    );
  }
  /**
   * Naviga hacía la página anterior
   */
  public navigationBack() {
    this.navContainer.back();
  }
  /**
   * Gestiona el cambio de jerarquía de banco
   */
  public async handlerChangeBankHier(event: any) {
    let btnShowHierarchy = event.getSource() as Button;
    this._popOverChangeBankHier ??= await (<Promise<Popover>>this.loadFragment({
      id: this.getView()?.getId() as string,
      name: "liqreport.fragment.hierarchyBank.ChangeBankHier",
    }));

    this._popOverChangeBankHier.openBy(btnShowHierarchy);
  }
  /**
   * Gestiona el cambio de jerarquía de banco
   */
  public async handlerChangeLiqItemHier(event: any) {
    let btnShowHierarchy = event.getSource() as Button;
    this._popOverChangeLiqItemHier ??= await (<Promise<Popover>>(
      this.loadFragment({
        id: this.getView()?.getId() as string,
        name: "liqreport.fragment.hierarchyLiquidity.ChangeLiqItemHier",
      })
    ));

    this._popOverChangeLiqItemHier.openBy(btnShowHierarchy);
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
    if (sId.includes(ID_LIQITEM_TREE_TABLE)) {
      fieldCatalog = this.getOwnerComponent()
        .hierarchyLiqItemState.getModel()
        .getProperty(oContext.sPath as string) as FieldCatalogTree;

      statePath = STATE_PATH.HIERARCHY_LIQ_ITEM;
    }

    return new Column(sId, {
      id: fieldCatalog?.name,
      visible: fieldCatalog.visible,
      width: fieldCatalog.width,
      label: new Label({
        text: fieldCatalog.label,
      }),
      hAlign: fieldCatalog.hAlign,
      template: this.fieldsFactory.getTemplateObjectforTableColumn(
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
   * Gestiona el evento de columnas actualizas en el tree table de posiciones de liquidez
   * @param event
   */
  public handlerTreeLiqItemRowsUpdated() {
    // Asociar el menu contextual a un campo de la tree table se tiene que hacer cuando se actualice las columnas ya que es una
    // tabla dinámica y las columnas se crean a través de una factory. Pero hay que tener en cuenta que este método se llama varias
    // veces y por eso hay que tener en cuenta para que solo se asocie una vez para evitar problemas de rendimiento.
    if (!this._liqItemTreeNodeValueColumnMenu)
      this._liqItemTreeNodeValueColumnMenu =
        this.associateColumnTreeContextualMenu(
          FIELDS_TREE.NODE,
          this.getOwnerComponent().hierarchyLiqItemState,
          this._liqItemTreeTable
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
      this.getOwnerComponent().hierarchyLiqItemState.clearModelValue();
    }

    // Pone los loader de los treeTable
    this.setLoadingStateHierTree(true);

    // Nota: La obtención de datos para la posición de liquidez se hace aquí porque la búsqueda de datos para construir la jerarquía
    // no depende de la smartable. Y de esta manera se hacen procesos en paralelo ganando en velocidad.
    // Se leen los datos cuando el radibutton de jerarquia de posiciones esta marcado o ya se han mostrado datos. Si se han mostrado
    // datos este servicio puede venir de un refresco o que se hayan cambiado datos de los filtros, en todo caso, se vuelve a leer los datos
    // para tenerlos actualizados.
    if (
      hierViewModel.radiobuttonHierLiqItem ||
      (this.getOwnerComponent().queryModel.getProperty(
        QUERY_MODEL.HIERARCHY_LIQITEM_SHOWED
      ) as boolean)
    )
      this.processBuildLiqItemHier(hierViewModel.inputIDLiquidity, false);
  }
  /**
   * Post proceso después de la carga de datos de cuentas
   */
  // private postAccountProcessLoadData() {  //LO DEJO COMENTADO PORQUE NO SÉ SI NOS ES ÚTIL LO QUE HAY EN EL ELSE
  //   // Si no hay datos puede ser por dos motivos 1) No ha encontrado datos con los filtros introducidos
  //   // 2) Que el servicio haya dado un error.
  //   // En ambos casos hay que:
  //   // 1) desactivar el loading(puede ser que no este activo si no se ha seleccionado jerarquía)
  //   // 2) Limpia el modo de datos de la jerarquía
  //   if (this.getOwnerComponent().accountBankState.getAccountData().length > 0) {
  //     // Se muestran las columnas de valore según los filtros en la smartable
  //     this.showColumnValues();

  //     let hierViewModel = this.getOwnerComponent().queryModel.getProperty(
  //       QUERY_MODEL.HIER_SELECT_VIEW_MODEL
  //     ) as HierarchySelectViewModel;

  //     // Se leen los datos cuando el radibutton de jerarquia de bancos esta marcado o ya se han mostrado datos. Si se han mostrado
  //     // datos este servicio puede venir de un refresco o que se hayan cambiado datos de los filtros, en todo caso, se vuelve a leer los datos
  //     // para tenerlos actualizados.
  //     if (
  //       hierViewModel.radiobuttonHierBank ||
  //       (this.getOwnerComponent().queryModel.getProperty(
  //         QUERY_MODEL.HIERARCHY_BANK_SHOWED
  //       ) as boolean)
  //     )
  //       this.processBuildBankHier(hierViewModel.inputIDBank, false);

  //     // Nota: La obtención de datos para la posición de liquidez se hace en el método "preAccountProcess..." el motivo es que las búsquedas
  //     // de datos son distintas a la de la smartable, y no tiene sentido esperarse a que termine la búsqueda para comenzar esta.
  //   } else {
  //     this.setLoadingStateHierTree(false);

  //     this.getOwnerComponent().hierarchyBankState.clearModelValue();
  //     this.getOwnerComponent().hierarchyLiqItemState.clearModelValue();
  //   }

  //   // Se indica que los filtros no han cambiado una vez obtenido todos los valores
  //   this._filterBarValuesChanged = false;
  // }
  /**
   * Establece el loader en los treeTable según el tipo de jerarquía que se este visualizando
   * @param loading
   */
  private setLoadingStateHierTree(loading: boolean) {
    let hierViewModel = this.getOwnerComponent().queryModel.getProperty(
      QUERY_MODEL.HIER_SELECT_VIEW_MODEL
    ) as HierarchySelectViewModel;

    if (
      hierViewModel.radiobuttonHierBank ||
      (this.getOwnerComponent().queryModel.getProperty(
        QUERY_MODEL.HIERARCHY_BANK_SHOWED
      ) as boolean)
    )
      this.getOwnerComponent().queryModel.setProperty(
        QUERY_MODEL.LOADING_HIER_BANK_PROCESS,
        loading
      );

    if (
      hierViewModel.radiobuttonHierLiqItem ||
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
    state: HierarchyLiqItemState,
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
    state: HierarchyLiqItemState,
    fieldname: string,
    oTable: TreeTable
  ): ItemBase[] {
    // Hay que definir un ID de tabla para añadir al ID de la acción ya que son acciones que se comparten con las dos tablas
    let idTable = ID_LIQITEM_TREE_TABLE;
    return [
      new ActionItem({
        id: `${idTable}_${PREFIX_TEXT_DISP_OPTION}${fieldname}_KEY`,
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
              this._liqItemTreeNodeValueColumnMenu,
              fieldname,
              TextDisplayOption.Key,
              event.getParameter("id") as string
            );
        },
      }),
      new ActionItem({
        id: `${idTable}_${PREFIX_TEXT_DISP_OPTION}${fieldname}_TEXT`,
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
              this._liqItemTreeNodeValueColumnMenu,
              fieldname,
              TextDisplayOption.Text,
              event.getParameter("id") as string
            );
        },
      }),
      new ActionItem({
        id: `${idTable}_${PREFIX_TEXT_DISP_OPTION}${fieldname}_TEXTKEY`,
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
              this._liqItemTreeNodeValueColumnMenu,
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
    state: HierarchyLiqItemState,
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
  }
  /**
   * Recupera el Id interno del treetable a partir del nombre de campo y el state
   * que gestiona sus datos
   * @param state State que gestiona los procesos
   * @param fieldname Nombre del campo
   * @returns
   */
  private getIdColumnFromState(
    state: HierarchyLiqItemState,
    fieldname: string
  ) {
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
      name: "liqreport.fragment.MessageApp",
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
