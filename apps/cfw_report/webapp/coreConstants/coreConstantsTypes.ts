export type ConstantID = string;
export type ConstantsID = ConstantID[];
export type ConstantValue = string;
export type ConstantValues = ConstantValue[];

export interface ConstantData {
  constante: ConstantID;
  valor: ConstantValue;
}
export type ConstantsData = ConstantData[];
