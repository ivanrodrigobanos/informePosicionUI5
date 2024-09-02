import TreeTableController from "./TreeTableController";
import AppComponent from "../Component";
import View from "sap/ui/core/mvc/View";
import TreeTable from "sap/ui/table/TreeTable";
import Button from "sap/m/Button";
import Popover from "sap/m/Popover";
import { FIELDS_TREE_INTERNAL } from "cfwreport/constants/treeConstants";
import { QUERY_MODEL } from "cfwreport/constants/models";
import { HierarchyTree } from "cfwreport/types/types";
import { NodeAndPathControl } from "cfwreport/types/hierarchyTypes";

export default class BankTreeViewController extends TreeTableController {
  private _btnShowMsgApp: Button;
  private _popOverMessagesApp: Popover;

  constructor(oComponent: AppComponent, treeTable: TreeTable, view: View) {
    super(oComponent, treeTable, view);

    // this._btnShowMsgApp = this._view.byId("btnShowMsgAppBankTree") as Button;
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
   * Pone un path de la jerarquía con el loading
   * @param path
   * @param loading
   */
  private setLoadingPath(path: string, loading: boolean) {
    let values = this.getValuesFromPath(path);

    values[FIELDS_TREE_INTERNAL.LOADING_VALUES] = loading;
    this.ownerComponent.hierarchyBankState.getModel().setProperty(path, values);
  }
}
