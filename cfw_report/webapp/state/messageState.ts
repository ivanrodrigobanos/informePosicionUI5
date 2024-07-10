import BaseStateSimple from "./baseStateSimple";
import AppComponent from "../Component";
import View from "sap/ui/core/mvc/View";
import MessageType from "sap/ui/core/message/MessageType";
import Message from "sap/ui/core/message/Message";
import Messaging from "sap/ui/core/Messaging";

export default class MessageState extends BaseStateSimple {
  private view: View;
  constructor(oComponent: AppComponent, view: View) {
    super(oComponent);

    this.view = view;
  }
  /**
   * Añade un mensaje
   * @param type Tipo
   * @param message Texto
   * @param additionalText Info adicional
   */
  public addMessage(
    type: MessageType,
    message: string,
    additionalText?: string
  ) {
    const oMessage = new Message({
      message: message,
      type: type,
      additionalText: additionalText ?? "",
      processor: this.view.getModel(),
    });
    Messaging.addMessages(oMessage);
  }
  /**
   * Añade un mensaje informativo
   * @param message Mensaje
   * @param additionalText Texto adicional
   */
  public AddInfoMessage(message: string, additionalText?: string) {
    this.addMessage(MessageType.Information, message, additionalText);
  }
  /**
   * Añade un mensaje error
   * @param message Mensaje
   * @param additionalText Texto adicional
   */
  public AddErrorMessage(message: string, additionalText?: string) {
    this.addMessage(MessageType.Error, message, additionalText);
  }
  /**
   * Añade un mensaje de exito
   * @param message Mensaje
   * @param additionalText Texto adicional
   */
  public AddSuccessMessage(message: string, additionalText?: string) {
    this.addMessage(MessageType.Success, message, additionalText);
  }
  /**
   * Añade un mensaje de warning
   * @param message Mensaje
   * @param additionalText Texto adicional
   */
  public AddWarningMessage(message: string, additionalText?: string) {
    this.addMessage(MessageType.Success, message, additionalText);
  }
  /**
   * Limpia todos los mensajes
   */
  public clearMessage() {
    Messaging.removeAllMessages();
  }
}
