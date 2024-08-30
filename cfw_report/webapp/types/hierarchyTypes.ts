export type HierarchyID = string;
export type HierarchyCategory = string;
export type HierarchyNode = string;
export type HierarchyNodes = Array<HierarchyNode>;

export enum TextDisplayOption {
  Key = "Key",
  Text = "Text",
  TextKey = "Text (key)",
}
export interface NodeAndPathControl {
  path: string;
  node: string;
  nodeType: string;
}
export type NodesAndPathControl = NodeAndPathControl[]
export interface NodeDetailInfo extends NodeAndPathControl { }
export type NodesDetailInfo = NodeDetailInfo[];

export interface ParamsReadHierarchy {
  include_noasign?: boolean;
}
