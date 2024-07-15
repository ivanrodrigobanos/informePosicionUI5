import BaseController from "./Base.Controller";
import SmartFilterBar from "sap/ui/comp/smartfilterbar/SmartFilterBar";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import SmartTable from "sap/ui/comp/smarttable/SmartTable";
import Table from "sap/ui/table/Table";
import { ValueState } from "sap/ui/core/library";
import { QUERY_MODEL } from "cfwreport/constants/models";
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
import { AccountsData } from "cfwreport/model/accountBankModel";
import { FieldCatalogTree } from "cfwreport/types/types";
import Label from "sap/m/Label";
import Column from "sap/ui/table/Column";
import { ColumnType } from "cfwreport/types/fieldCatalogTypes";
import Text from "sap/m/Text";
import {
  CUSTOM_DATA,
  NUMBER_FIX_FIELDS,
  STATE_PATH,
} from "cfwreport/constants/treeConstants";
import { FIELDS_TREE_ACCOUNT } from "cfwreport/constants/treeConstants";
import TreeTable from "sap/ui/table/TreeTable";
import MessageState from "cfwreport/state/messageState";
import View from "sap/ui/core/mvc/View";
import Item from "sap/ui/core/Item";
import MessageToast from "sap/m/MessageToast";
import MetadataHelper, { MetadataObject } from "sap/m/p13n/MetadataHelper";
import Engine from "sap/m/p13n/Engine";
import SelectionController from "sap/m/p13n/SelectionController";
import ColumnWidthController from "sap/m/table/ColumnWidthController";
import CustomData from "sap/ui/core/CustomData";
import Conversion from "cfwreport/utils/conversion";
import ObjectStatus from "sap/m/ObjectStatus";
import Formatters from "cfwreport/utils/formatters";

/**
 * @namespace cfwreport.controller
 */
export default class Main extends BaseController {
  private _sfb: SmartFilterBar;
  private _st: SmartTable;
  private _stInternalTable: Table;
  private _navContainter: NavContainer;
  private _popOverHierarchySelect: Popover;
  private _popOverChangeBankHier: Popover;
  private _bankTreeTable: TreeTable;
  private _messageState: MessageState;
  private _popOverMessagesApp: Popover;
  private _btnShowMessageAppRaw: Button;
  private _btnShowMessageAppTree: Button;
  private _filterBarValuesChanged: boolean;
  private _bankTreeMetadataHelper: MetadataHelper;
  private _bankTreeMDHInitialWidth: Record<string, string>;

  /*eslint-disable @typescript-eslint/no-empty-function*/
  public onInit(): void {
    this._sfb = this.byId("SFBQuery") as SmartFilterBar;
    this._st = this.byId("SFTQuery") as SmartTable;
    this._navContainter = this.byId("navContainer") as NavContainer;
    this._bankTreeTable = this.byId("BankTreeTable") as TreeTable;
    this._btnShowMessageAppRaw = this.byId("btnShowMessageAppRaw") as Button;
    this._btnShowMessageAppTree = this.byId("btnShowMessageAppTree") as Button;

    this.setModel(
      this.getOwnerComponent().hierarchyBankState.getModel(),
      "hierarchyBankState"
    );
    this.setModel(
      this.getOwnerComponent().accountBankState.getModel(),
      "accountBankState"
    );
    this._messageState = new MessageState(
      this.getOwnerComponent(),
      this.getView() as View
    );

    // Controla si se han modificado los valores de los filtros
    this._filterBarValuesChanged = true;

    this._bankTreeMDHInitialWidth = {};

    this._bankTreeTable.setFixedColumnCount(NUMBER_FIX_FIELDS); // Campos fijos en la jerarquía del arbol
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
    this._messageState.clearMessage();

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
        this.showColumnValues(modelValue);
        this.getOwnerComponent().accountBankState.setAccountData(modelValue);
      } else {
        this._messageState.AddErrorMessage(
          this.geti18nResourceBundle().getText(
            "accountDataTable.errorGetService"
          ) as string
        );
        this.showMessageApp(this._btnShowMessageAppRaw)
          .then(() => {})
          .catch(() => {});
      }
      this.postAccountProcessLoadData();
    });
  }

  /**
   * Muestra la selección de la jerarquía a visualizar
   * @param event
   */
  public async showHierarchySelect(event: any): Promise<void> {
    this._messageState.clearMessage();

    //if (this.getOwnerComponent().accountBankState.getAccountData().length > 0) {
    let btnShowHierarchy = event.getSource() as Button;
    this._popOverHierarchySelect ??= await (<Promise<Popover>>this.loadFragment(
      {
        id: this.getView()?.getId() as string,
        name: "cfwreport.fragment.HierarchySelect",
      }
    ));

    this._popOverHierarchySelect.openBy(btnShowHierarchy);
    /*} else {
      MessageToast.show(
        this.geti18nResourceBundle().getText(
          "accountDataTable.hierarchyInfoAccountDataNoLoaded"
        ) as string
      );
    }*/
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
            "hierarchySelect.mandatoryBankHier"
          ) as string;
      } else {
        if (hierViewModel.inputIDBank === hierViewModel.inputIDBankPrevious) {
          msgToastText = this.geti18nResourceBundle().getText(
            "hierarchySelect.notHierChanged"
          ) as string;
        } else {
          hierViewModel.inputIDBankPrevious = hierViewModel.inputIDBank; // Guardo el previo
          // Si los filtros se han modificado y se navega hacia una jerarquía se realiza la misma acción que al refrescar. Es decir,
          // leer los datos de la tabla principal para poder construir la jerarquía. Si no se han modificado se hace la lectura directa
          // de los datos de jerarquía
          if (this._filterBarValuesChanged) {
            // Activamos el loader de la tabla de jerarquía
            this.getOwnerComponent().queryModel.setProperty(
              QUERY_MODEL.LOADING_HIER_PROCESS,
              true
            );
            // Navegamos a la tabla de jerarquía de bancos
            this.navigateToHierarchyBank();

            this.handlerRefreshData();
          } else {
            this.processBuildBankHier(hierViewModel.inputIDBank, true);
          }
        }

        closePopover = true;
      }
    } else if (hierViewModel.inputIDLiquidityEnabled) {
      if (hierViewModel.inputIDLiquidity === "") {
        hierViewModel.inputIDLiquidityValueState = ValueState.Error;
        hierViewModel.inputIDLiquidityValueStateText =
          this.geti18nResourceBundle().getText(
            "hierarchySelect.mandatoryBankHier"
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
          msgToastText = "No implementado";
        }

        closePopover = true;
      }
    } else {
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
  public handlerLoadHierBank(event: any) {
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
    this._messageState.clearMessage();

    // Solo si los filtros cambian se limpia el modelo, de esta manera no hay refrescos innecesarios en la tabla
    if (this._filterBarValuesChanged)
      this.getOwnerComponent().hierarchyBankState.clearModelValue(true); // No se refresca el catalogo

    // Si no se ha mostrado todavía la jerarquía se registran los campos que podrán ser modificados
    // en la personalización del menú
    if (
      !this.getOwnerComponent().queryModel.getProperty(
        QUERY_MODEL.HIERARCHY_SHOWN
      )
    )
      this.registerFieldsEngineBankTree();

    // Se inicial proceso de generacion de la jerarquía de bancos.
    this.getOwnerComponent().queryModel.setProperty(
      QUERY_MODEL.LOADING_HIER_PROCESS,
      true
    );
    this.getOwnerComponent()
      .hierarchyBankState.processHierarchyWithAccountData(IDHierarchy)
      .then(() => {
        if (
          !this.getOwnerComponent().queryModel.getProperty(
            QUERY_MODEL.HIERARCHY_SHOWN
          )
        )
          this._bankTreeTable.expandToLevel(1);

        this.getOwnerComponent().queryModel.setProperty(
          QUERY_MODEL.LOADING_HIER_PROCESS,
          false
        );
        this.getOwnerComponent().queryModel.setProperty(
          QUERY_MODEL.HIERARCHY_SHOWN,
          true
        );
      })
      .catch(() => {
        this.showMessageApp(this._btnShowMessageAppTree)
          .then(() => {})
          .catch(() => {});

        this.getOwnerComponent().queryModel.setProperty(
          QUERY_MODEL.LOADING_HIER_PROCESS,
          false
        );
        // Si hay error no queremos que se vean los datos previos que pueda tener
        this.getOwnerComponent().hierarchyBankState.clearModelValue();
      });

    if (navigate) this.navigateToHierarchyBank();
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
  public navigateToHierarchyBank() {
    this._navContainter.to(this.byId(NAVIGATION_ID.HIERARCHY_BANK) as Control);
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
    let fieldCatalog = this.getOwnerComponent()
      .hierarchyBankState.getModel()
      .getProperty(oContext.sPath as string) as FieldCatalogTree;

    return new Column(sId, {
      id: fieldCatalog.name,
      visible: true,
      width: fieldCatalog.width,
      label: new Label({
        text: fieldCatalog.label,
      }),
      hAlign: fieldCatalog.hAlign,
      template: this.getTemplateObjectforTableColumn(fieldCatalog),
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
  public async onShowMessageApp(event: any) {
    await this.showMessageApp(event.getSource() as Button);
  }
  /**
   * Muestra los mensajes de la aplicación
   * @param event
   */
  public async showMessageApp(button: Button): Promise<void> {
    this._popOverMessagesApp ??= await (<Promise<Popover>>this.loadFragment({
      id: this.getView()?.getId() as string,
      name: "cfwreport.fragment.MessageApp",
    }));

    this._popOverMessagesApp.openBy(button);
  }
  /**
   * Expande el primer nivel del arbol
   */
  public onTreeExpandFirstLevel(event: any) {
    let treeTable = event.getSource().getParent().getParent() as TreeTable;
    treeTable.expandToLevel(1);
  }
  /**
   * Expande los niveles seleccionados
   */
  public onTreeExpandSelection(event: any) {
    // Source es el botón, su padre la toolbar, y el padre del toolbar la treeTable
    let treeTable = event.getSource().getParent().getParent() as TreeTable;
    treeTable.expand(treeTable.getSelectedIndices());
  }
  /**
   * Contrae todo
   */
  public onTreeCollapseAll(event: any) {
    let treeTable = event.getSource().getParent().getParent() as TreeTable;
    treeTable.collapseAll();
  }
  /**
   * Contrae los niveles seleccionados
   */
  public onTreeCollapseSelection(event: any) {
    let treeTable = event.getSource().getParent().getParent() as TreeTable;
    treeTable.collapse(treeTable.getSelectedIndices());
  }
  /**
   * Gestiona el refresco manual de datos
   */
  public handlerRefreshData() {
    // Procesos antes de la lectura de datos
    this.preAccountProcessLoadData();

    // Se lanza el proceso de lectura de datos de la smartable
    this._st.rebindTable(true);
  }
  /**
   * Registra en la tabla de jerarquía de bancos la personalización de campos
   */
  public registerFieldsEngineBankTree() {
    let fixFields =
      this.getOwnerComponent().hierarchyBankState.getFixFieldsFieldCatalog();

    let fieldsMDH: MetadataObject[] = [];

    // Se excluye el campo fijo del valor del nodo para que no entre dentro del state, ya que no puede tocarse para
    // que la jerarquía se vea correctamente.
    fixFields
      .filter((row) => row.name !== FIELDS_TREE_ACCOUNT.NODE_VALUE)
      .forEach((row, index) => {
        // Al ser una tabla dinámica el ID del campo es la concatenación del ID de la tabla+el índice de la tabla.
        // Al índice se le suma el numero de campos fijos para calcular correctamente el índice real del campo
        fieldsMDH.push({
          key: `BankTreeTable-${index + NUMBER_FIX_FIELDS}`,
          label: row.label,
          path: row.name,
          visible: true,
        });
        this._bankTreeMDHInitialWidth[row.name] = row.width;
      });
    this._bankTreeMetadataHelper = new MetadataHelper(fieldsMDH);

    Engine.getInstance().register(this._bankTreeTable, {
      helper: this._bankTreeMetadataHelper,
      controller: {
        Columns: new SelectionController({
          targetAggregation: "columns",
          control: this._bankTreeTable,
        }),
        /*Sorter: new SortController({
						control: this._bankTreeTable
					}),
					Groups: new GroupController({
						control: this._bankTreeTable
					}),*/
        ColumnWidth: new ColumnWidthController({
          control: this._bankTreeTable,
        }),
      },
    });

    Engine.getInstance().attachStateChange(
      this.handlerBankTreeMDHStateChange.bind(this)
    );
  }
  /**
   * Gestiona la modificación de los estados de la personalización de la tabla
   * de jerarquía de bancos.
   */
  public handlerBankTreeMDHStateChange(event: any) {
    const oState = event.getParameter("state");

    if (!oState) {
      return;
    }
    let tableColumns = this._bankTreeTable.getColumns();
    tableColumns.forEach((column, columnIndex) => {
      let columnKey = this.getKey(column);

      // Sacamos el nombre interno en el catalogo de campos, ya que en la columna ese campo
      // se pierde aunque se pase como id en la columna.
      let internalField = column
        .getCustomData()
        .find((row) => row.getKey() === CUSTOM_DATA.INTERNAL_FIELD)
        ?.getValue();

      // El campo donde esta la jerarquía y los importes no se tocan porque no aparecen en la personalización de campos
      if (
        internalField !== FIELDS_TREE_ACCOUNT.NODE_VALUE &&
        internalField.indexOf(ENTITY_FIELDS_DATA.AMOUNT_DATA) === -1
      ) {
        // Si la clave de la columna no esta en el estado es que no la quieren ver, en caso contrario la vuelvo a mostrar, aunque
        // puede ser que ya este en visible.
        let stateIndex = oState.Columns.findIndex(
          (row: any) => row.key === columnKey
        );
        if (stateIndex === -1) {
          column.setVisible(false);
        } else {
          column.setVisible(true);

          // Si la columna es visible miro si la posición en la tabla y en la del state son la misma.
          // Si no lo son se mueve la columna de la tabla a la posición del state. Eso si, a la posición
          // se le suma el numero de campos fijos para que se posicione en el sitio correcto.
          if (columnIndex !== stateIndex) {
            this._bankTreeTable.removeColumn(column);
            this._bankTreeTable.insertColumn(
              column,
              (stateIndex as number) + NUMBER_FIX_FIELDS
            );
          }
        }
      }
    });
  }
  /**
   * Gestiona la configuración del tree tabla de bancos
   */
  public async handlerBankTreeTableConf(event: any) {
    await Engine.getInstance().show(this._bankTreeTable, ["Columns"], {
      source: event.getSource(),
    });
  }
  private getKey(oControl: any) {
    return (this.getView() as View).getLocalId(oControl.getId() as string);
  }
  /**
   * Procesos que se realizan antes de buscar datos desde los dos sitios:
   * Botón "Ir" de la smartfilterbar y botón refrescar en la toolbar de las dos tablas
   */
  private preAccountProcessLoadData() {
    // Solo si los filtros cambian se limpia el modelo, de esta manera no hay refrescos innecesarios en la tabla
    if (this._filterBarValuesChanged)
      this.getOwnerComponent().accountBankState.clearModelValue();

    // Se mira si la jerarquía ya ha sido mostrada. Si es así, se inician procesos
    if (
      this.getOwnerComponent().queryModel.getProperty(
        QUERY_MODEL.HIERARCHY_SHOWN
      ) as boolean
    )
      this.getOwnerComponent().queryModel.setProperty(
        QUERY_MODEL.LOADING_HIER_PROCESS,
        true
      );
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
      let hierViewModel = this.getOwnerComponent().queryModel.getProperty(
        QUERY_MODEL.HIER_SELECT_VIEW_MODEL
      ) as HierarchySelectViewModel;

      if (hierViewModel.inputIDBankEnabled)
        this.processBuildBankHier(hierViewModel.inputIDBank, false);
    } else {
      this.getOwnerComponent().queryModel.setProperty(
        QUERY_MODEL.LOADING_HIER_PROCESS,
        false
      );

      this.getOwnerComponent().hierarchyBankState.clearModelValue();
    }

    // Se indica que los filtros no han cambiado una vez obtenido todos los valores
    this._filterBarValuesChanged = false;
  }
  /**
   * Devuevle el control donde se pinta el valor en las tablas dinámicas
   * en base a la configuración del campo
   * @param fieldCatalog Datos del catalogo de campo
   * @returns
   */
  private getTemplateObjectforTableColumn(
    fieldCatalog: FieldCatalogTree
  ): Control {
    if (fieldCatalog.name === FIELDS_TREE_ACCOUNT.COMPANY_CODE) {
      return new Text({
        text: {
          parts: [
            { path: `${STATE_PATH.BANK}${fieldCatalog.name}` },
            {
              path: `${STATE_PATH.BANK}${FIELDS_TREE_ACCOUNT.COMPANY_CODE_NAME}`,
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

    if (fieldCatalog.type === ColumnType.Amount) {
      let criticField = fieldCatalog.name.replace(
        ENTITY_FIELDS_DATA.AMOUNT_DATA,
        ENTITY_FIELDS_DATA.AMOUNT_CRITICITY
      );
      return new ObjectStatus({
        text: {
          parts: [
            { path: `${STATE_PATH.BANK}${fieldCatalog.name}` },
            { path: `${STATE_PATH.BANK}${FIELDS_TREE_ACCOUNT.CURRENCY}` },
          ],
          formatter: function (amount: number, currency: string) {
            return Formatters.amount2String(amount, currency);
          },
        },
        state: {
          path: `${STATE_PATH.BANK}${criticField}`,
          formatter: function (value: any) {
            return Conversion.criticallyToValueState(Number(value));
          },
        },
      });
    }
    return new Text({
      text: { path: `${STATE_PATH.BANK}${fieldCatalog.name}` },
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
  private showColumnValues(queryValues: AccountsData): void {
    if (queryValues.length > 0) {
      let initialRowQuery = queryValues[0];
      let tableColumns = this._stInternalTable.getColumns();
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
}
