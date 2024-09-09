export const STATE_PATH = {
  HIERARCHY_BANK: "hierarchyBankState",
  ACCOUNT_BANK: "accountBankState",
  ACCOUNT_LIQ_ITEM: "accountLiqItemState",
  HIERARCHY_LIQ_ITEM: "hierarchyLiqItemState",
};

export const FIELDS_TREE = {
  NODE: "node",
  NODE_NAME: "node_name",
  NODE_LEVEL: "node_level",
  NODE_TYPE: "node_type",
  PARENT_NODE: "parent_node",
  NODE_DISPLAY_ORDER: "node_display_order",
};

export const FIELDS_TREE_INTERNAL = {
  SHOW_BTN_PLV: "showBtnDetail",
  LOADING_VALUES: "loadingValues",
  CHILD_NODE: "accounts",
  SHOW_POPOVER_NAV: "showPopOverNav",
};
export const FIELDS_TREE_ACCOUNT = {
  NODE_VALUE_WIDTH: "30rem",
  BANK_ACCOUNT_PARTNER: "bank_account_partner",
  BANK_ACCOUNT_PARTNER_WIDTH: "15rem",
  COMPANY_CODE: "company_code",
  COMPANY_CODE_NAME: "company_code_name",
  COMPANY_CODE_NAME_WIDTH: "10rem",
  CURRENCY: "currency",
  HOUSE_BANK: "house_bank",
  HOUSE_BANK_WIDTH: "7rem",
  HOUSE_BANK_ACCOUNT: "house_bank_account",
  HOUSE_BANK_ACCOUNT_WIDTH: "6rem",
  PLANNING_LEVEL: "planning_level",
  PLANNING_LEVEL_WIDTH: "7rem",
  PLANNING_LEVEL_NAME: "planning_level_name",
  AMOUNT_DATA_WIDTH: "9rem",
  OVERDUE_AMOUNT: "overdue_amount",
  OVERDUE_AMOUNT_WIDTH: "7rem",
  OVERDUE_CRITIC: "overdue_critic",
  BANK_ACCOUNT: "bank_account",
  BANK_ACCOUNT_NAME: "bank_account_name",
};
export const FIELDS_TREE_LIQITEM = {
  NODE_VALUE_WIDTH: "30rem",
  CURRENCY: "currency",
  LIQUIDITY_ITEM: "liquidity_item",
  LIQUIDITY_ITEM_WIDTH: "7rem",
  LIQUIDITY_ITEM_NAME: "liquidity_item_name",
  AMOUNT_DATA_WIDTH: "9rem",
  OVERDUE_AMOUNT: "overdue_amount",
  OVERDUE_AMOUNT_WIDTH: "9rem",
};

export const CUSTOM_DATA = {
  INTERNAL_FIELD: "fcatName",
};

export const NUMBER_FIX_FIELDS = 1;

export const ID_BANK_TREE_TABLE = "BankTreeTable";
export const ID_LIQITEM_TREE_TABLE = "LiqItemTreeTable";

export const NODE_TYPES = {
  ROOT: "R",
  NODE: "N",
  LEAF: "L",
  PLANNING_LEVEL: "PLV",
};

export const PREFIX_TEXT_DISP_OPTION = "MENU_TEXT_DISPLAY_";

export const SOURCE_TYPES = {
  SALDO_INI: "SDOVALINI",
  SALDO_FIN: "SDOVALFIN",
  MOVIMIENTOS: "MOVIMIENTOS",
};

export const CRITICALLY = {
  SUCCES: 3,
  WARNING: 2,
  ERROR: 1,
  INFORMATION: 5,
  NEUTRAL: 0,
};
export const NODE_NOASIGN = "NOASIGN";

export const PACKAGE_ACCOUNT_PLV = 100;

export const PATH_NAVIGATION_MODEL = {
  HIERARCHY_BANK: "navigationHierBank",
  HIERARCHY_LIQ_ITEM: "navigationHierLiqItem",
};

// Sustituir esta constante por un servicio que lo lea del abapcloud
export const SAP_HOST = "https://demo2str.stratesys.global:44300";
export const SAP_CLIENT = "200";
export const SAP_PATH = "/sap/bc/ui2/flp";
