import BaseController from "./Base.Controller";
import SmartFilterBar from "sap/ui/comp/smartfilterbar/SmartFilterBar";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import SmartTable from "sap/ui/comp/smarttable/SmartTable";
import Table from "sap/ui/table/Table";
import Menu from "sap/m/table/columnmenu/Menu";
import ActionItem from "sap/m/table/columnmenu/ActionItem";
import { ValueState } from "sap/ui/core/library";
import { MESSAGE_MODEL, QUERY_MODEL } from "liqreport/constants/models";
import { ENTITY_FIELDS_DATA } from "liqreport/constants/smartConstants";
import { FiltersQuery, HierarchySelectViewModel } from "liqreport/types/types";
import DateFormat from "liqreport/utils/dateFormat";
import NavContainer from "sap/m/NavContainer";
import { NAVIGATION_ID } from "liqreport/constants/navigation";
import Control from "sap/ui/core/Control";
import Button from "sap/m/Button";
import Popover from "sap/m/Popover";
import RadioButton from "sap/m/RadioButton";
import Dialog from "sap/m/Dialog";
import View from "sap/ui/core/mvc/View";
import Item from "sap/ui/core/Item";
import MessageToast from "sap/m/MessageToast";
import ItemBase from "sap/m/table/columnmenu/ItemBase";
import Engine from "sap/m/p13n/Engine";
import CustomData from "sap/ui/core/CustomData";
import TreeTable from "sap/ui/table/TreeTable";
import { AccountsData } from "liqreport/types/accountBankTypes";
import { FieldCatalogTree } from "liqreport/types/types";
import Label from "sap/m/Label";
import Column from "sap/ui/table/Column";

/**
 * @namespace liqreport.controller
 */
export default class View1 extends Controller {

    /*eslint-disable @typescript-eslint/no-empty-function*/
    public onInit(): void {

    }
}