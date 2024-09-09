export default class DateFormat {
  /**
   * Convierte a una fecha para que cuando se pase a UTC en el servicio no cambie de día.
   * Ocurre cuando las fechas del datePicker o New Date ponen la hora 00:00:00. Esto hace que
   * al pasar a UTC si nuestro usuario horario es -1 se cambia de día.
   * @param date
   * @returns
   */
  static convertUTCDateToLocalDate(date: Date) {
    let newDate = new Date(date);

    let offset = date.getTimezoneOffset() / 60;
    let hours = date.getHours();

    newDate.setHours(hours - offset);

    return newDate;
  }
  /**
   * Convierte la fecha de SAP a fecha de JS
   * @param sapDate
   * @returns
   */
  static convertSAPDate2Date(sapDate: string): Date {
    let dateChar = `${sapDate.substr(0, 4)}-${sapDate.substr(
      4,
      2
    )}-${sapDate.substr(6, 2)}`;
    return new Date(dateChar);
  }
  /**
   * Convierte una fecha al formato local del navegador
   * @param date
   * @returns
   */
  static convertDate2Locale(date: Date): string {
    let options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    };
    return date.toLocaleDateString(navigator.language, options);
  }
  /**
   * Convierte una fecha SAP al formato local del navegador
   * @param sapDate
   * @returns
   */
  static convertSAPDate2Locale(sapDate: string): string {
    let date = this.convertSAPDate2Date(sapDate);
    let dateLocale = this.convertDate2Locale(date);
    return dateLocale;
  }
  /**
   * Convierte una fecha al formato ISO teniendo el cuenta la zona horaria
   * @param date
   * @returns
   */
  static convertDate2ISO(date: Date): string {
    const offset = date.getTimezoneOffset();
    let dateOffset = new Date(date.getTime() - offset * 60 * 1000);
    return dateOffset.toISOString().split("T")[0];
  }
}
