import Object from "sap/ui/base/Object";
import { NodesDetailInfo } from "cfwreport/types/hierarchyTypes";

export default class HierarchyGeneralModel extends Object {
  protected nodeDetailInfo: NodesDetailInfo;

  constructor() {
    super();
    this.nodeDetailInfo = [];
  }
  /**
   * Añade los datos de los nodos que tienen información detallada. Esos nodos
   * actualmente es el de la cuenta.
   * @param node Id del nodo
   * @param treePath path del arbol donde se ha hecho el detalle
   */
  public addNodeDetailInfo = (node: string, treePath: string) => {
    // Solo se añaden si no existe. Ya que a este método se llamará en refrescos como en búsquedas manuales.
    if (this.nodeDetailInfo.findIndex((row) => row.node === node) === -1)
      this.nodeDetailInfo.push({ node: node, path: treePath });
  };
  /**
   * Devuelve los nodos expandidos con su detalle
   * @returns
   */
  public getNodesDetailInfo = (): NodesDetailInfo => {
    return this.nodeDetailInfo;
  };
}
