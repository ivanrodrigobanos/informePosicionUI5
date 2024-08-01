import BaseModel from "./baseModel";

export interface Hierarchy {
  node: string;
  node_level: number;
  node_name: string;
  parent_node: string;
  node_type: string;
  hierarchy_id: string;
  hierarchy_category: string;
  node_display_order: number;
}
export type Hierarchys = Hierarchy[];

export default class HierarchyModel extends BaseModel<Hierarchys> {
  private _hierarchy: Hierarchys;

  constructor(data?: Hierarchys) {
    super();
    if (data) this._hierarchy = this.transformData(data);
  }
  public getData(): Hierarchys {
    return this._hierarchy;
  }
  public transformData(data: Hierarchys): Hierarchys {
    return data.map((row) => {
      return {
        ...row,
        node_level: Number(row.node_level),
        node_display_order: Number(row.node_display_order),
      };
    });
  }
  public clearData() {
    this._hierarchy = [];
  }
}
