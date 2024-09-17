import TreeTableController from "./TreeTableController";
import AppComponent from "../Component";
import View from "sap/ui/core/mvc/View";
import TreeTable from "sap/ui/table/TreeTable";
import Button from "sap/m/Button";
import Popover from "sap/m/Popover";
import {
  CUSTOM_DATA,
  FIELDS_TREE,
  FIELDS_TREE_ACCOUNT,
  FIELDS_TREE_INTERNAL,
  NODE_TYPES,
} from "cfwreport/constants/treeConstants";
import { QUERY_MODEL } from "cfwreport/constants/models";
import { HierarchyTree, NavigationInfo } from "cfwreport/types/types";
import { NodeAndPathControl } from "cfwreport/types/hierarchyTypes";
import Controller from "sap/ui/core/mvc/Controller";
import Control from "sap/ui/core/Control";
import JSONModel from "sap/ui/model/json/JSONModel";
import CustomData from "sap/ui/core/CustomData";
import { ENTITY_FIELDS_DATA } from "cfwreport/constants/smartConstants";
import DateFormat from "cfwreport/utils/dateFormat";
import {
  CONSTANT_SAP_CLIENT,
  CONSTANT_SAP_HOST,
  CONSTANT_SAP_PATH,
} from "cfwreport/constants/generalConstants";

type NavigationData = {
  info: NavigationInfo;
};

export default class BankTreeViewController extends TreeTableController {
  private _btnShowMsgApp: Button;
  private _popOverMessagesApp: Popover;
  private popOverBankNavOptions: Popover;
  private controller: Controller;
  private navigationModel: JSONModel;
  private navigationData: NavigationData;

  constructor(
    oComponent: AppComponent,
    treeTable: TreeTable,
    view: View,
    controller: Controller
  ) {
    super(oComponent, treeTable, view);
    this.controller = controller;
    this.navigationData = {
      info: {
        company_code: "",
        company_code_name: "",
        node: "",
        node_name: "",
        node_type: "",
        title: "",
        bank_account: "",
        bank_account_name: "",
        date_formatted: "",
        show_planning_level: false,
        bank_account_number: "",
        currency: "",
      },
    };
  }
  public getNavigationModel(): JSONModel {
    if (!this.navigationModel) {
      this.navigationModel = new JSONModel(this.navigationData);
    }
    return this.navigationModel;
  }
  public setPopOverMessageApp(popover: Popover) {
    this._popOverMessagesApp = popover;
  }
  public setBtnShowMessageApp(button: Button) {
    this._btnShowMsgApp = button;
  }
  /**
   * Proceso que registra los campos que se van a ver en la personalización de la tabla
   */
  public registerFieldsEngineBankTree() {
    this.registerFieldsEngineTree(
      this.ownerComponent.hierarchyBankState.getFixFieldsFieldCatalog()
    );
  }

  public applyPersonalizationUpdateTable() {
    this.applyPersonalization(
      this.ownerComponent.hierarchyBankState.getFieldCatalog()
    );
  }
  /**
   * Proceso de construcción de la jerarquía de bancos
   * @param IDHierarchy Id de jerarquía
   * @param navigate Navega a la vista de jerarquía
   */
  public processBuildBankHier(
    IDHierarchy: string,
    filterBarValuesChanged: boolean,
    handlerOnSuccess?: () => void,
    handlerOnError?: () => void
  ) {
    // Solo si los filtros cambian se limpia el modelo, de esta manera no hay refrescos innecesarios en la tabla
    if (filterBarValuesChanged)
      this.ownerComponent.hierarchyBankState.clearModelValue(true); // No se refresca el catalogo

    // Si no se ha mostrado todavía la jerarquía se registran los campos que podrán ser modificados
    // en la personalización del menú
    if (
      !this.ownerComponent.queryModel.getProperty(
        QUERY_MODEL.HIERARCHY_BANK_SHOWED
      )
    )
      this.registerFieldsEngineBankTree();

    // Se inicial proceso de generacion de la jerarquía de bancos.
    this.ownerComponent.queryModel.setProperty(
      QUERY_MODEL.LOADING_HIER_BANK_PROCESS,
      true
    );
    this.ownerComponent.hierarchyBankState
      .processHierarchyWithAccountData(IDHierarchy)
      .then(() => {
        if (
          !this.ownerComponent.queryModel.getProperty(
            QUERY_MODEL.HIERARCHY_BANK_SHOWED
          )
        )
          this.treeTable.expandToLevel(1);

        this.ownerComponent.queryModel.setProperty(
          QUERY_MODEL.LOADING_HIER_BANK_PROCESS,
          false
        );
        this.ownerComponent.queryModel.setProperty(
          QUERY_MODEL.HIERARCHY_BANK_SHOWED,
          true
        );
        // Se mira si hay nodos los cuales se ha mostrado el detalle. Si es así se lanza el proceso
        // que es el mismo que se haría manualmente para volver a obtener sus valores
        if (
          this.ownerComponent.hierarchyBankState.getNodesDetailInfo().length > 0
        )
          this.processAddPlanningLevelData(
            this.ownerComponent.hierarchyBankState
              .getNodesDetailInfo()
              .map((row) => row.path)
          );

        if (handlerOnSuccess) handlerOnSuccess();
      })
      .catch(() => {
        this.ownerComponent.queryModel.setProperty(
          QUERY_MODEL.HIERARCHY_BANK_SHOWED,
          true
        );
        this.ownerComponent.queryModel.setProperty(
          QUERY_MODEL.LOADING_HIER_BANK_PROCESS,
          false
        );
        // Si hay error no queremos que se vean los datos previos que pueda tener
        this.ownerComponent.hierarchyBankState.clearModelValue();

        if (handlerOnError) handlerOnError();
      });
  }
  /**
   * Proceso para añadir los datos de nivel de tesoreria
   * @param paths
   */
  processAddPlanningLevelData(paths: string[]) {
    this.ownerComponent.messageState.clearMessage();
    let promises: Promise<any>[] = [];

    paths.forEach((path) => {
      // Se informa el loader en el botón pulsado
      this.setLoadingPath(path, true);

      // Se añade la promesa encargada de buscar los datos y añadirlos a la jerarquía plana.
      promises.push(
        Promise.resolve(
          this.ownerComponent.hierarchyBankState.addPlvHierarchyFromPath(path)
        )
      );
    });

    Promise.all(promises)
      .then((response) => {
        // Por cada registro procesado se expande su nivel y se guarda que ese nodo se ha expandido
        response.forEach((rowResponse: NodeAndPathControl) => {
          this.ownerComponent.hierarchyBankState.addNodeDetailInfo(
            rowResponse.node,
            rowResponse.path,
            rowResponse.nodeType
          );
          this.expandNodeFromPath(rowResponse.path);
        });
        // Una vez finalizado las distintas búsquedas se recalcula la criticidad en los nodos superior y se regenera el arbol para la TreeTable
        this.ownerComponent.hierarchyBankState.redetermineCriticNodesHierFlat();
        this.ownerComponent.hierarchyBankState.rebuildHierarchyTree();
      })
      .catch(() => {
        paths.forEach((path) => {
          this.setLoadingPath(path, false);

          this.ownerComponent.messageState.AddErrorMessage(
            this.ownerComponent
              .getI18nBundle()
              .getText("bankAccountTree.msgErrorServicePlv") as string
          );
        });
      });
  }
  /**
   * Devuelve los valores a partir de un path
   * @param path
   * @returns
   */
  public getValuesFromPath(path: string): HierarchyTree {
    return this.ownerComponent.hierarchyBankState
      .getModel()
      .getProperty(path) as HierarchyTree;
  }
  /**
   * Gestiona el cambio de jerarquía de banco
   */
  public async handlerPopOverNavBankHier(statePath: string, event: any) {
    let oRow = event.getSource().getParent();
    let values = oRow.getBindingContext(statePath).getObject();

    this.navigationData.info.node = values[FIELDS_TREE.NODE];
    this.navigationData.info.node_name = values[FIELDS_TREE.NODE_NAME];
    this.navigationData.info.node_type = values[FIELDS_TREE.NODE_TYPE];
    this.navigationData.info.company_code =
      values[FIELDS_TREE_ACCOUNT.COMPANY_CODE];
    this.navigationData.info.company_code_name =
      values[FIELDS_TREE_ACCOUNT.COMPANY_CODE_NAME];
    this.navigationData.info.bank_account =
      values[FIELDS_TREE_ACCOUNT.BANK_ACCOUNT];
    this.navigationData.info.bank_account_name =
      values[FIELDS_TREE_ACCOUNT.BANK_ACCOUNT_NAME];
    this.navigationData.info.bank_account_number =
      values[FIELDS_TREE_ACCOUNT.BANK_ACCOUNT_NUMBER];
    this.navigationData.info.currency = values[FIELDS_TREE_ACCOUNT.CURRENCY];

    this.navigationData.info.show_planning_level =
      values[FIELDS_TREE.NODE_TYPE] === NODE_TYPES.PLANNING_LEVEL
        ? true
        : false;

    let amountField = event
      .getSource()
      .getCustomData()
      .find((row: CustomData) => row.getKey() === CUSTOM_DATA.INTERNAL_FIELD)
      ?.getValue();
    let labelField = amountField.replace(
      ENTITY_FIELDS_DATA.AMOUNT_DATA,
      ENTITY_FIELDS_DATA.AMOUNT_LABEL
    );
    this.navigationData.info.date = DateFormat.convertSAPDate2Date(
      values[labelField] as string
    );
    this.navigationData.info.date_formatted = DateFormat.convertDate2Locale(
      this.navigationData.info.date
    );
    this.navigationData.info.url_nav_detail = this.buildURLNavigate2Detail(
      this.navigationData.info
    );
    this.navigationData.info.url_nav_transfer_to =
      this.buildURLNavigateTransferTo(this.navigationData.info);
    this.navigationData.info.url_nav_transfer_from =
      this.buildURLNavigateTransferFrom(this.navigationData.info);
    this.navigationData.info.url_nav_create_memorecord =
      this.buildURLNavigateCreateMemorecord(this.navigationData.info);

    this.navigationData.info.title = this.ownerComponent
      .getI18nBundle()
      .getText("bankAccountTree.popoverNavigationTitle", [
        this.navigationData.info.node,
        this.navigationData.info.date_formatted,
      ]) as string;
    this.navigationModel.refresh();

    this.popOverBankNavOptions ??= await (<Promise<Popover>>(
      this.controller.loadFragment({
        id: this.view?.getId(),
        name: "cfwreport.fragment.popoverNavigation.NavOptionsBankHier",
      })
    ));

    this.popOverBankNavOptions.openBy(event.getSource() as Control);
  }
  /**
   * Pone un path de la jerarquía con el loading
   * @param path
   * @param loading
   */
  private setLoadingPath(path: string, loading: boolean) {
    let values = this.getValuesFromPath(path);

    values[FIELDS_TREE_INTERNAL.LOADING_VALUES] = loading;
    this.ownerComponent.hierarchyBankState.getModel().setProperty(path, values);
  }
  /**
   * Construye la URL para navegar al detalle de las posiciones
   * @param info
   * @returns
   */
  private buildURLNavigate2Detail(info: NavigationInfo): string {
    let fechaIso = DateFormat.convertDate2ISO(info.date as Date);

    let url = `${this.ownerComponent.coreConstantsState.getConstantValue(
      CONSTANT_SAP_HOST
    )}/${this.ownerComponent.coreConstantsState.getConstantValue(
      CONSTANT_SAP_PATH
    )}?sap-client=${this.ownerComponent.coreConstantsState.getConstantValue(
      CONSTANT_SAP_CLIENT
    )}#BankAccount-analyzePaymentDetails?`;

    url += `BankAccountInternalID=${info.bank_account}`;
    if (info.node_type === NODE_TYPES.PLANNING_LEVEL)
      url += `&PlanningLevel=${info.node}`;

    url += `&TransactionDate=${fechaIso}`;
    url += "&CashFlowScopeForAccounting=2";
    return url;
  }
  /**
   * Construye la URL para la aplicación de crear transfería a
   * @param info
   * @returns
   */
  private buildURLNavigateTransferTo(info: NavigationInfo): string {
    let fechaIso = DateFormat.convertDate2ISO(info.date as Date);
    let url = `${this.ownerComponent.coreConstantsState.getConstantValue(
      CONSTANT_SAP_HOST
    )}/${this.ownerComponent.coreConstantsState.getConstantValue(
      CONSTANT_SAP_PATH
    )}?sap-client=${this.ownerComponent.coreConstantsState.getConstantValue(
      CONSTANT_SAP_CLIENT
    )}#BankAccount-transferTo?`;
    url += `BankAccountInternalID=${info.bank_account}`;
    url += `&BankAccountNumber=${info.bank_account_number}`;
    url += `&KeyDate=${fechaIso}`;
    url += `&currency=${info.currency}`;
    // Paramétros fijos
    url +=
      "&ReleaseFlag=0&TransferFrom=X&TransferTo=X&btn_visible=true&checked=true&displayCurrency=";
    url +=
      "& isData=X & isTransactionCur=X & level=3 & newDataNode=true & noNav=false & preferredMode=create";

    return url;
  }
  /**
   * Construye la URL para la aplicación de crear transfería de
   * @param info
   * @returns
   */
  private buildURLNavigateTransferFrom(info: NavigationInfo): string {
    let fechaIso = DateFormat.convertDate2ISO(info.date as Date);
    let url = `${this.ownerComponent.coreConstantsState.getConstantValue(
      CONSTANT_SAP_HOST
    )}/${this.ownerComponent.coreConstantsState.getConstantValue(
      CONSTANT_SAP_PATH
    )}?sap-client=${this.ownerComponent.coreConstantsState.getConstantValue(
      CONSTANT_SAP_CLIENT
    )}#BankAccount-transferFrom?`;
    url += `BankAccountInternalID=${info.bank_account}`;
    url += `&BankAccountNumber=${info.bank_account_number}`;
    url += `&KeyDate=${fechaIso}`;
    url += `&currency=${info.currency}`;
    // Paramétros fijos
    url +=
      "&ReleaseFlag=0&TransferFrom=X&TransferTo=X&btn_visible=true&checked=true&displayCurrency=";
    url +=
      "& isData=X & isTransactionCur=X & level=3 & newDataNode=true & noNav=false & preferredMode=create";

    return url;
  }
  /**
   * Construye la URL para la aplicación de crear registro individual o memorecord
   * @param info
   * @returns
   */
  private buildURLNavigateCreateMemorecord(info: NavigationInfo): string {
    let fechaIso = DateFormat.convertDate2ISO(info.date as Date);
    let url = `${this.ownerComponent.coreConstantsState.getConstantValue(
      CONSTANT_SAP_HOST
    )}/${this.ownerComponent.coreConstantsState.getConstantValue(
      CONSTANT_SAP_PATH
    )}?sap-client=${this.ownerComponent.coreConstantsState.getConstantValue(
      CONSTANT_SAP_CLIENT
    )}#MemoRecord-create?`;
    url += `BankAccountInternalID=${info.bank_account}`;
    url += `&BankAccount=${info.bank_account_number}`;
    url += `&CashReqValueDate=${fechaIso}`;
    url += `&currency=${info.currency}`;
    // Paramétros fijos
    url +=
      "&btn_visible=true&checked=true&isData=X&isTransactionCur=X&level=3&newDataNode=true";

    return url;
  }
}
