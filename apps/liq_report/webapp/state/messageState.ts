import { ButtonType } from "sap/m/library";
import BaseStateModel from "./baseStateModel";
import AppComponent from "../Component";
import MessageType from "sap/ui/core/message/MessageType";
import MessageModel from "liqreport/model/messageModel";

export type MessageData = {
  messages: MessageModel;
  showMessage: boolean;
  highestSeverityType: ButtonType;
  highestSeverityNumber: number;
  highestSeverityIcon: string;
};
export default class MessageState extends BaseStateModel<MessageData> {
  constructor(oComponent: AppComponent) {
    super(oComponent);

    this.data = {
      messages: new MessageModel(),
      showMessage: false,
      highestSeverityType: ButtonType.Neutral,
      highestSeverityNumber: 0,
      highestSeverityIcon: "",
    };
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
    this.getData().messages.addMessage(type, message, additionalText);
    this.getData().showMessage = true;
    this.determineHighestSeverity();

    this.updateModel();
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
    this.getData().messages.clearData();
    this.getData().showMessage = false;

    this.updateModel();
  }
  /**
   * Determina la severidad del boton de mensajes y el numero de mensajes con esa severidad
   */
  private determineHighestSeverity() {
    let highestSeverity = this.getData().messages.getHighestSeverity();

    // Tipo de botón y el icono del mismo
    if (highestSeverity === MessageType.Error) {
      this.getData().highestSeverityType = ButtonType.Negative;
      this.getData().highestSeverityIcon = "sap-icon://error";
    } else if (highestSeverity === MessageType.Warning) {
      this.getData().highestSeverityType = ButtonType.Critical;
      this.getData().highestSeverityIcon = "sap-icon://alert";
    } else if (
      highestSeverity === MessageType.Success ||
      highestSeverity === MessageType.Information
    ) {
      this.getData().highestSeverityType = ButtonType.Success;
      this.getData().highestSeverityIcon = "sap-icon://sys-enter-2";
    } else {
      this.getData().highestSeverityType = ButtonType.Neutral;
      this.getData().highestSeverityIcon = "sap-icon://information";
    }

    this.getData().highestSeverityNumber =
      this.getData().messages.getNumberMessageSeverity(highestSeverity);
  }
}
