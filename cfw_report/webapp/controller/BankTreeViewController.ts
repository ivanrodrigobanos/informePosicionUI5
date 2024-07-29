import TreeTableController from "./TreeTableController";
import AppComponent from "../Component";
import MetadataHelper, { MetadataObject } from "sap/m/p13n/MetadataHelper";
import Engine from "sap/m/p13n/Engine";
import SelectionController from "sap/m/p13n/SelectionController";
import ColumnWidthController from "sap/m/table/ColumnWidthController";
import View from "sap/ui/core/mvc/View";
import TreeTable from "sap/ui/table/TreeTable";
import Button from "sap/m/Button";
import Popover from "sap/m/Popover";
import {
  CUSTOM_DATA,
  FIELDS_TREE_INTERNAL,
} from "cfwreport/constants/treeConstants";
import { QUERY_MODEL } from "cfwreport/constants/models";
import { HierarchyTree } from "cfwreport/types/types";
import { NodeAndPathControl } from "cfwreport/types/hierarchyTypes";

export default class BankTreeViewController extends TreeTableController {
  //private treeTable: TreeTable;
  private _bankTreeMDHInitialWidth: Record<string, string>;
  private _bankTreeMetadataHelper: MetadataHelper;
  private _btnShowMsgApp: Button;
  private _popOverMessagesApp: Popover;

  constructor(oComponent: AppComponent, treeTable: TreeTable, view: View) {
    super(oComponent, treeTable, view);

    this._bankTreeMDHInitialWidth = {};

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
    let fieldsMDH: MetadataObject[] = [];

    let fieldCatalog =
      this.ownerComponent.hierarchyBankState.getFixFieldsFieldCatalog();
    // Solo se leen los campos que tengan permita la personalizacion
    fieldCatalog
      .filter((row) => row.allowPersonalization)
      .forEach((row) => {
        fieldsMDH.push({
          key: row.internalID,
          label: row.label,
          path: row.name,
          visible: true,
        });
        this._bankTreeMDHInitialWidth[row.name] = row.width;
      });

    this._bankTreeMetadataHelper = new MetadataHelper(fieldsMDH);

    Engine.getInstance().register(this.treeTable, {
      helper: this._bankTreeMetadataHelper,
      controller: {
        Columns: new SelectionController({
          targetAggregation: "columns",
          control: this.treeTable,
        }),
        /*Sorter: new SortController({
						control: this.treeTable
					}),
					Groups: new GroupController({
						control: this.treeTable
					}),*/
        ColumnWidth: new ColumnWidthController({
          control: this.treeTable,
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
    let tableColumns = this.treeTable.getColumns();
    let fieldCatalog = this.ownerComponent.hierarchyBankState.getFieldCatalog();
    tableColumns.forEach((column, columnIndex) => {
      let columnKey = this.getKey(column);

      // Sacamos el nombre interno en el catalogo de campos, ya que en la columna ese campo
      // se pierde aunque se pase como id en la columna.
      let internalField = column
        .getCustomData()
        .find((row) => row.getKey() === CUSTOM_DATA.INTERNAL_FIELD)
        ?.getValue();

      // Buscamos el campo en el catalogo para saber si tiene permitida la personalización.
      let rowFcat = fieldCatalog.find((row) => row.name === internalField);
      if (rowFcat && rowFcat.allowPersonalization) {
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
            this.treeTable.removeColumn(column);
            this.treeTable.insertColumn(column, rowFcat.pos);
          }
        }
      }
    });
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
      !this.ownerComponent.queryModel.getProperty(QUERY_MODEL.HIERARCHY_SHOWN)
    )
      this.registerFieldsEngineBankTree();

    // Se inicial proceso de generacion de la jerarquía de bancos.
    this.ownerComponent.queryModel.setProperty(
      QUERY_MODEL.LOADING_HIER_PROCESS,
      true
    );
    this.ownerComponent.hierarchyBankState
      .processHierarchyWithAccountData(IDHierarchy)
      .then(() => {
        if (
          !this.ownerComponent.queryModel.getProperty(
            QUERY_MODEL.HIERARCHY_SHOWN
          )
        )
          this.treeTable.expandToLevel(1);

        this.ownerComponent.queryModel.setProperty(
          QUERY_MODEL.LOADING_HIER_PROCESS,
          false
        );
        this.ownerComponent.queryModel.setProperty(
          QUERY_MODEL.HIERARCHY_SHOWN,
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
          QUERY_MODEL.LOADING_HIER_PROCESS,
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
        this.ownerComponent.hierarchyBankState.addPlvHierarchyFromPath(path)
      );
    });
    Promise.all(promises)
      .then((response) => {
        // Una vez finalizado las distintas búsquedas se:recalcula la criticidad en los nodos superior y se regenera el arbol para la TreeTable
        this.ownerComponent.hierarchyBankState.redetermineCriticNodesHierFlat();
        this.ownerComponent.hierarchyBankState.rebuildHierarchyTree();

        // Por cada registro procesado se expande su nivel y se guarda que ese nodo se ha expandido
        response.forEach((rowResponse: NodeAndPathControl) => {
          this.ownerComponent.hierarchyBankState.addNodeDetailInfo(
            rowResponse.node,
            rowResponse.path
          );
          this.expandNodeFromPath(rowResponse.path);
        });
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
    let value = this.getValuesFromPath(path);

    value[FIELDS_TREE_INTERNAL.LOADING_VALUES] = loading;
    this.ownerComponent.hierarchyBankState.getModel().setProperty(path, value);
  }

  /**
   * Devuelve la clave el id interno de un objeto
   * @param oControl
   * @returns
   */
  private getKey(oControl: any) {
    return this.view.getLocalId(oControl.getId() as string);
  }
}
