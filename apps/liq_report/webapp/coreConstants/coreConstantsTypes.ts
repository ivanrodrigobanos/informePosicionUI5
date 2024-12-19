export type ConstantID = string;
export type ConstantsID = ConstantID[];
export type ConstantValue = string;
export type ConstantValues = ConstantValue[];

export interface ConstantData {
  Constante: ConstantID;
  Valor: ConstantValue;
}
export type ConstantsData = ConstantData[];

export interface SAPUrl {
  http_url: string;
  https_url: string;
}
