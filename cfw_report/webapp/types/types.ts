import { HorizontalAlign, ValueState } from "sap/ui/core/library";
import { ColumnType } from "cfwreport/types/fieldCatalogTypes";

export type HierarchyFlat = Record<string, string | number>;
export type HierarchysFlat = HierarchyFlat[];
export type HierarchyTree = Record<string, any>;
export type HierarchysTree = HierarchyTree[];

export type FiltersQuery = {
  dateFrom: Date;
  dateFromValueState: ValueState;
  dateFromValueStateMessage: string;
  dateTo: Date;
  dateToValueState: ValueState;
  dateToValueStateMessage: string;
  company_code: string[];
  displayCurrency: string;
};

export type AccountDataQueryViewModel = {
  dummy: string;
};

export type HierarchySelectViewModel = {
  inputIDBankEnabled: boolean;
  inputIDBank: string;
  inputIDBankPrevious: string;
  inputIDBankValueState: ValueState;
  inputIDBankValueStateText: string;
  inputIDLiquidityEnabled: boolean;
  inputIDLiquidity: string;
  inputIDLiquidityPrevious: string;
  inputIDLiquidityValueState: ValueState;
  inputIDLiquidityValueStateText: string;
};

export interface FieldCatalogTree {
  name: string;
  label: string;
  quickinfo: string;
  type: ColumnType;
  pos: number;
  currencyField?: string;
  width: string;
  hAlign: HorizontalAlign;
  allowPersonalization: boolean;
  internalID: string;
  visible: boolean;
}
export type FieldsCatalogTree = FieldCatalogTree[];

export type AccountAmount = Record<string, number | string>;
