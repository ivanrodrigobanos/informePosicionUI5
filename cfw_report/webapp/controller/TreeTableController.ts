import BaseStateSimple from "cfwreport/state/baseStateSimple";
import AppComponent from "../Component";
import TreeTable from "sap/ui/table/TreeTable";
import View from "sap/ui/core/mvc/View";
import { NUMBER_FIX_FIELDS } from "cfwreport/constants/treeConstants";

export default class TreeTableController extends BaseStateSimple {
  protected treeTable: TreeTable;
  protected view: View;

  constructor(oComponent: AppComponent, treeTable: TreeTable, view: View) {
    super(oComponent);

    this.setTreeTable(treeTable);
    this.setView(view);
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
}
