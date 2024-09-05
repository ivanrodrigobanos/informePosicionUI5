import TreeTableController from "./TreeTableController";
import AppComponent from "../Component";
import View from "sap/ui/core/mvc/View";
import TreeTable from "sap/ui/table/TreeTable";
import { QUERY_MODEL } from "cfwreport/constants/models";

export default class LiqItemTreeViewController extends TreeTableController {
  constructor(oComponent: AppComponent, treeTable: TreeTable, view: View) {
    super(oComponent, treeTable, view);
  }
  /**
   * Proceso de construcción de la jerarquía de posiciones de liquidez
   * @param IDHierarchy Id de jerarquía
   * @param navigate Navega a la vista de jerarquía
   */
  public processBuildHierarchy(
    IDHierarchy: string,
    filterBarValuesChanged: boolean,
    handlerOnSuccess?: () => void,
    handlerOnError?: () => void
  ) {
    // Solo si los filtros cambian se limpia el modelo, de esta manera no hay refrescos innecesarios en la tabla
    if (filterBarValuesChanged)
      this.ownerComponent.hierarchyLiqItemState.clearModelValue(true); // No se refresca el catalogo

    // Si no se ha mostrado todavía la jerarquía se registran los campos que podrán ser modificados
    // en la personalización del menú
    if (
      !this.ownerComponent.queryModel.getProperty(
        QUERY_MODEL.HIERARCHY_LIQITEM_SHOWED
      )
    )
      this.registerFieldsEngineLiqItemTree();

    // Se inicial proceso de generacion de la jerarquía de posiciones de liquidez.
    this.ownerComponent.queryModel.setProperty(
      QUERY_MODEL.LOADING_HIER_LIQITEM_PROCESS,
      true
    );
    let filterValues = this.ownerComponent.getFiltersValues();

    // Leemos en paralelo los importes de las posiciones de liquidez y la jeraquía.
    Promise.all([
      this.ownerComponent.accountLiqItemState.readAccountData({
        dateFrom: filterValues.dateFrom,
        dateTo: filterValues.dateTo,
        displayCurrency: filterValues.displayCurrency,
      }),
      this.ownerComponent.hierarchyLiqItemState.readHierarchy(IDHierarchy),
    ])
      .then(() => {
        this.ownerComponent.hierarchyLiqItemState.processBuildHierarchy();

        if (
          !this.ownerComponent.queryModel.getProperty(
            QUERY_MODEL.HIERARCHY_LIQITEM_SHOWED
          )
        )
          this.treeTable.expandToLevel(1);

        this.ownerComponent.queryModel.setProperty(
          QUERY_MODEL.LOADING_HIER_LIQITEM_PROCESS,
          false
        );
        this.ownerComponent.queryModel.setProperty(
          QUERY_MODEL.HIERARCHY_LIQITEM_SHOWED,
          true
        );

        
      })
      .catch(() => {
        this.ownerComponent.queryModel.setProperty(
          QUERY_MODEL.HIERARCHY_LIQITEM_SHOWED,
          true
        );
        this.ownerComponent.queryModel.setProperty(
          QUERY_MODEL.LOADING_HIER_LIQITEM_PROCESS,
          false
        );
        // Si hay error no queremos que se vean los datos previos que pueda tener
        this.ownerComponent.hierarchyLiqItemState.clearModelValue();

        this.ownerComponent.messageState.AddErrorMessage(
          this.ownerComponent
            .getI18nBundle()
            .getText("liqItemAccountTree.msgErrorService") as string
        );

        if (handlerOnError) handlerOnError();
      });
  }
  /**
   * Proceso que registra los campos que se van a ver en la personalización de la tabla
   */
  public registerFieldsEngineLiqItemTree() {
    this.registerFieldsEngineTree(
      this.ownerComponent.hierarchyLiqItemState.getFixFieldsFieldCatalog()
    );
  }
}
