import BaseStateSimple from "liqreport/state/baseStateSimple";
import AppComponent from "../Component";
import TreeTable from "sap/ui/table/TreeTable";
import View from "sap/ui/core/mvc/View";
import {
  CUSTOM_DATA,
  NUMBER_FIX_FIELDS,
} from "liqreport/constants/treeConstants";
import { FieldsCatalogTree } from "liqreport/types/types";
import Engine from "sap/m/p13n/Engine";
import MetadataHelper, { MetadataObject } from "sap/m/p13n/MetadataHelper";
import SelectionController from "sap/m/p13n/SelectionController";
import ColumnWidthController from "sap/m/table/ColumnWidthController";

export default class TreeTableController extends BaseStateSimple {
  protected treeTable: TreeTable;
  protected view: View;
  protected treeMDHInitialWidth: Record<string, string>;
  protected treeMetadataHelper: MetadataHelper;

  constructor(oComponent: AppComponent, treeTable: TreeTable, view: View) {
    super(oComponent);

    this.setTreeTable(treeTable);
    this.setView(view);
    this.treeMDHInitialWidth = {};
    // this._btnShowMsgApp = this._view.byId("btnShowMsgAppBankTree") as Button;
  }
  public setView(view: View) {
    this.view = view;
  }
  public setTreeTable(treeTable: TreeTable) {
    this.treeTable = treeTable;
  }
  public getTreeTable(): TreeTable {
    return this.treeTable;
  }
  public initPropsTreeTable() {
    this.treeTable.setFixedColumnCount(NUMBER_FIX_FIELDS); // Campos fijos en la jerarquía del arbol
    this.treeTable.setRowMode("Auto");
  }
  /**
   * Expande un nodo apartir del path del modelo
   * @param path
   */
  public expandNodeFromPath(path: string) {
    // Hay dos manera de sacar los items que se ven en la tree table. Primera forma:
    // this._treeTable.getBinding("rows").getNodes() -> Devuelve un array y el path se saca: node.context.sPath
    // Segunda manera: this._treeTable.getBinding("rows").getContexts() -> devuelve un array uy el path se saca con
    // context.getPath().
    // Voy a escoger la primera porque por nombre parece la más adecuada
    let nodes = (this.treeTable.getBinding("rows") as any).getNodes();
    let index = nodes.findIndex((node: any) => node.context.sPath === path);
    if (index !== -1) this.treeTable.expand(index as number);
  }
  /**
   * Gestiona la modificación de los estados de la personalización de la tabla
   * de jerarquía de bancos.
   */
  public handlerTreeMDHStateChange(event: any) {
    const oState = event.getParameter("state");

    if (!oState) {
      return;
    }

    this.applyPersonalization(
      // event.getParameter("control").getId().includes(ID_BANK_TREE_TABLE)
      //   ? this.ownerComponent.hierarchyBankState.getFieldCatalog()
      //  : []
      []
    );
  }

  protected applyPersonalization(fieldCatalog: FieldsCatalogTree) {
    if (fieldCatalog.length === 0) return;

    var that = this;
    Engine.getInstance()
      .retrieveState(this.treeTable)
      .then(function (oState: any) {
        let tableColumns = that.treeTable.getColumns();
        tableColumns.forEach((column, columnIndex) => {
          let columnKey = that.getKey(column);

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
                that.treeTable.removeColumn(column);
                that.treeTable.insertColumn(column, rowFcat.pos);
              }
            }
          }
        });
      })
      .catch(() => {});
  }
  /**
   * Devuelve la clave el id interno de un objeto
   * @param oControl
   * @returns
   */
  protected getKey(oControl: any) {
    return this.view.getLocalId(oControl.getId() as string);
  }
  protected registerFieldsEngineTree(fieldCatalog: FieldsCatalogTree) {
    let fieldsMDH: MetadataObject[] = [];

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
        this.treeMDHInitialWidth[row.name] = row.width;
      });

    this.treeMetadataHelper = new MetadataHelper(fieldsMDH);

    Engine.getInstance().register(this.treeTable, {
      helper: this.treeMetadataHelper,
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
      this.handlerTreeMDHStateChange.bind(this)
    );
  }
}
