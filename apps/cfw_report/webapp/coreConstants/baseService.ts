import Object from "sap/ui/base/Object";
import ODataModel from "sap/ui/model/odata/v2/ODataModel";
import Filter from "sap/ui/model/Filter";
import Sorter from "sap/ui/model/Sorter";

type odataMethods = "read" | "create" | "update" | "remove";
type parameters<T> = {
  context?: Record<string, unknown>;
  urlParameters?: Record<string, string>;
  filters?: Filter[];
  sorters?: Sorter[];
  success?: (result: T, response: Response) => void;
  error?: (error: unknown) => void;
  batchGroupId?: string;
  groupId?: string;
  updateAggregatedMessages?: boolean;
};
type response<T> = {
  data: T;
  response: Response;
};

export type ErrorResponse = {
  statusCode: number;
  statusText: string;
  message: string;
};

export default class BaseService extends Object {
  protected model: ODataModel;
  constructor(oDataModel: ODataModel) {
    super();

    this.setModel(oDataModel);
  }
  public setModel(model: ODataModel): void {
    this.model = model;
  }
  public getModel(): ODataModel {
    return this.model;
  }
  public odata(url: string) {
    const core = {
      ajax: <T>(
        type: odataMethods,
        url: string,
        parameters?: parameters<T>,
        data?: T
      ): Promise<response<T>> => {
        const promise = new Promise<response<T>>((resolve, reject) => {
          let params: parameters<T> = {};
          if (parameters) {
            params = parameters;
          }
          params.success = (result: T, response): void => {
            const responseResult: response<T> = {
              data: result,
              response: response,
            };
            resolve(responseResult);
          };
          params.error = function (error: any) {
            let errorResponse: ErrorResponse = {
              statusCode: error.statusCode as number,
              statusText: error.statusText as string,
              message: "",
            };
            // Segun el status de error el proceso como se trata el mensaje puede variar
            if (error.statusCode === 500) {
              // El texto completo esta en el tag message dentro del XML generado.
              errorResponse.message = $(error.responseText)
                .find("message")
                .text();
            } else if (error.statusCode >= 400 && error.statusCode <= 500) {
              // Nota: En los bad request aunque desde SAP se devuelvan dos excepciones solo recoge la última. Pero lo gracioso es que el message manager
              // recoge las dos.
              var oErrorData = JSON.parse(error.responseText as string); // Se pasa la respuesta a un JSON para sacar el mensaje
              errorResponse.message = oErrorData.error.message.value;
            } else {
              // Cualquier otro error devuelve el mensaje devuelto
              errorResponse.message = error.responseText;
            }
            reject(errorResponse);
          };
          if (data) {
            this.model[type](
              url,
              data as unknown as Record<string, unknown>,
              params
            );
          } else {
            this.model[type](url, params);
          }
        });
        return promise;
      },
    };
    return {
      get: <T>(params?: parameters<T>): Promise<response<T>> =>
        core.ajax("read", url, params),
      post: <T>(data: T, params?: parameters<T>): Promise<response<T>> =>
        core.ajax("create", url, params, data),
      put: <T>(data: T, params?: parameters<T>): Promise<response<T>> =>
        core.ajax("update", url, params, data),
      delete: <T>(params?: parameters<T>): Promise<response<T>> =>
        core.ajax("remove", url, params),
    };
  }
}
