import BaseModel from "./baseModel";

export interface HierarchyBank {
  node: string;
  node_level: number;
  node_name: string;
  parent_node: string;
  node_type: string;
  hierarchy_id: string;
  hierarchy_category: string;
  node_display_order: number;
}
export type HierarchyBanks = HierarchyBank[];

export default class HierarchyBankModel extends BaseModel<HierarchyBanks> {
  private _hierarchy: HierarchyBanks;

  constructor(data?: HierarchyBanks) {
    super();
    if (data) this._hierarchy = this.transformData(data);
  }
  public getData(): HierarchyBanks {
    return this._hierarchy;
  }
  public transformData(data: HierarchyBanks): HierarchyBanks {
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
