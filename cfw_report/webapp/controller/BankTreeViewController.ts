import BaseStateSimple from "cfwreport/state/baseStateSimple";
import AppComponent from "../Component";
import MetadataHelper, { MetadataObject } from "sap/m/p13n/MetadataHelper";
import Engine from "sap/m/p13n/Engine";
import SelectionController from "sap/m/p13n/SelectionController";
import ColumnWidthController from "sap/m/table/ColumnWidthController";
import View from "sap/ui/core/mvc/View";
import TreeTable from "sap/ui/table/TreeTable";
import {
  CUSTOM_DATA,
  FIELDS_TREE_INTERNAL,
  NUMBER_FIX_FIELDS,
} from "cfwreport/constants/treeConstants";
import { QUERY_MODEL } from "cfwreport/constants/models";
import Button from "sap/m/Button";
import { HierarchyTree } from "cfwreport/types/types";

export default class BankTreeViewController extends BaseStateSimple {
  private _bankTreeTable: TreeTable;
  private _bankTreeMDHInitialWidth: Record<string, string>;
  private _bankTreeMetadataHelper: MetadataHelper;
  private _view: View;
  private _btnShowMessageAppTree: Button;

  constructor(oComponent: AppComponent, treeTable: TreeTable, view: View) {
    super(oComponent);

    this._bankTreeMDHInitialWidth = {};
    this.setTreeTable(treeTable);
    this.setView(view);
    this._btnShowMessageAppTree = this._view.byId(
      "btnShowMessageAppTree"
    ) as Button;
  }
  public setView(view: View) {
    this._view = view;
  }
  public setTreeTable(treeTable: TreeTable) {
    this._bankTreeTable = treeTable;
  }
  public getTreeTable(): TreeTable {
    return this._bankTreeTable;
  }
  public initPropsTreeTable() {
    this._bankTreeTable.setFixedColumnCount(NUMBER_FIX_FIELDS); // Campos fijos en la jerarquía del arbol
    this._bankTreeTable.setRowMode("Auto");
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
            this._bankTreeTable.removeColumn(column);
            this._bankTreeTable.insertColumn(column, rowFcat.pos);
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
          this._bankTreeTable.expandToLevel(1);

        this.ownerComponent.queryModel.setProperty(
          QUERY_MODEL.LOADING_HIER_PROCESS,
          false
        );
        this.ownerComponent.queryModel.setProperty(
          QUERY_MODEL.HIERARCHY_SHOWN,
          true
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
    paths.forEach((path) => {
      // Se informa el loader en el botón pulsado
      this.setLoadingPath(path, true);

      this.ownerComponent.hierarchyBankState
        .processAddPlvHierarchy(path)
        .then((response) => {
          this.setLoadingPath(path, false);
        })
        .catch(() => {
          this.setLoadingPath(path, false);
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
    return this._view.getLocalId(oControl.getId() as string);
  }
}
