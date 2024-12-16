import BaseStateSimple from "./baseStateSimple";
import AppComponent from "../Component";
import ODataMetaModel, {
  EntitySet,
  EntityType,
  Property,
} from "sap/ui/model/odata/ODataMetaModel";
import {
  ENTITY_FIELDS_DATA,
  MAIN_ENTITY_SET,
} from "liqreport/constants/smartConstants";

export type MetadataData = {
  metaModel: ODataMetaModel;
};

export interface FieldEntity {
  name: string;
  label: string;
  quickinfo: string;
}
export type FieldsEntity = FieldEntity[];

export default class MetadataState extends BaseStateSimple {
  private data: MetadataData;
  constructor(oComponent: AppComponent) {
    super(oComponent);

    this.data = {
      metaModel: this.ownerComponent
        .getModel()
        ?.getMetaModel() as ODataMetaModel,
    };
  }
  /**
   * Devuelve la entidad a partir de una entity set
   * @param entitySet
   * @returns
   */
  public getEntityType(entitySet: string = MAIN_ENTITY_SET): string {
    return (this.data.metaModel?.getODataEntitySet(entitySet) as EntitySet)
      .entityType;
  }
  /**
   * Devuelve los campos del metadatos de una entidad.
   * Hay que devolver los campos como any[] y no Property[] debido
   * a que hay un campo "sap:label" que no esta en ninguno de los tipos definidos. Y esto
   * provoca errores de typescript. Y la unica manera de solventarlo así de esta manera
   * @param entitySet Nombre de la entidad
   * @returns
   */
  public getFieldsEntitySet(entitySet: string = MAIN_ENTITY_SET): any[] {
    return (
      this.data.metaModel.getODataEntityType(
        this.getEntityType(entitySet)
      ) as EntityType
    )?.property as Property[];
  }
  /**
   * Devuelve los campos de los importes
   * @returns
   */
  public getAmountFields(): string[] {
    return (
      (this.getFieldsEntitySet(MAIN_ENTITY_SET) as Property[])
        .filter(
          (column) => column.name.indexOf(ENTITY_FIELDS_DATA.AMOUNT_DATA) !== -1
        )
        .map((column) => column.name) ?? []
    );
  }
  /**
   * Devuelve el numero de campos de importe que hay en el servicio
   */
  public getNumberAmountFields(): number {
    return this.getAmountFields()?.length ?? 0;
  }
  /**
   * Obtiene la info básica de un campo de la entidad para montar el catalogo de campos
   * @param fieldname Nombre del campo
   * @returns Devuelve la información del campo
   */
  public getFieldInfo(
    fieldname: string,
    entitySet: string = MAIN_ENTITY_SET
  ): FieldEntity {
    let fieldEntity: FieldEntity = {
      name: fieldname,
      label: "",
      quickinfo: "",
    };

    let rowMetadata = this.getFieldsEntitySet(entitySet).find(
      (row) => row.name == fieldname
    );
    if (rowMetadata) {
      fieldEntity.label = rowMetadata["sap:label"];
      fieldEntity.quickinfo = fieldEntity.label;
    }

    return fieldEntity;
  }
}
