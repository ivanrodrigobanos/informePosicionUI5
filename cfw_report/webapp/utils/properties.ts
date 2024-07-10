export default class Properties {
  /**
   * Devuelve el valor de un campo de un objeto.
   * Es un ejemplo sacado parcialmente de aquí https://mariusschulz.com/blog/keyof-and-lookup-types-in-typescript
   * donde explica casi el mismo ejemplo pero en el devuelve el tipo. A este artículo llevo a través de stackoverflow
   * donde si que ponen el mismo ejemplo
   * @param obj | Objeto
   * @param key | Clave
   * @returns Valor de la clave del objeto
   */
  static get<T, K extends keyof T>(obj: T, key: K): T[K] {
    return obj[key];
  }
  /**
   * Basandome en el método GET monto el SET
   * @param obj | Objeto
   * @param key | Clave
   * @param value
   * @returns Valor de la clave del objeto
   */
  static set<T, K extends keyof T>(obj: T, key: K, value: T[K]): T[K] {
    return (obj[key] = value);
  }
}
