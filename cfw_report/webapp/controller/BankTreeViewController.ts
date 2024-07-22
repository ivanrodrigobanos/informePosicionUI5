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
  NUMBER_FIX_FIELDS,
} from "cfwreport/constants/treeConstants";

export default class BankTreeViewController extends BaseStateSimple {
  private _bankTreeTable: TreeTable;
  private _bankTreeMDHInitialWidth: Record<string, string>;
  private _bankTreeMetadataHelper: MetadataHelper;
  private _view: View;

  constructor(oComponent: AppComponent, treeTable: TreeTable, view: View) {
    super(oComponent);

    this._bankTreeMDHInitialWidth = {};
    this.setTreeTable(treeTable);
    this.setView(view);
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
   * Devuelve la clave el id interno de un objeto
   * @param oControl
   * @returns
   */
  private getKey(oControl: any) {
    return this._view.getLocalId(oControl.getId() as string);
  }
}
