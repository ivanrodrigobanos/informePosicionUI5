import { TextDisplayOption } from "cfwreport/types/hierarchyTypes";
import NumberFormat from "sap/ui/core/format/NumberFormat";

export default class Formatters {
  /**
   * Convierte un importe y moneda a formato string
   * @param amount
   * @param currency
   * @returns String formatead
   */
  static amount2String(amount: number, currency: string): string {
    let format = NumberFormat.getCurrencyInstance({
      currencyCode: true,
    });
    return format.format(amount, currency);
  }
  static fieldKeyText(
    key: string,
    text: string,
    displayOption: TextDisplayOption
  ) {
    if (displayOption === TextDisplayOption.Key) return key;
    else if (displayOption === TextDisplayOption.Text) return text;
    else if (displayOption === TextDisplayOption.TextKey)
      return `${text} (${key})`;

    return "";
  }
}
