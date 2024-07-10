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
}
