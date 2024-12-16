import BaseModel from "./baseModel";
import MessageType from "sap/ui/core/message/MessageType";

export interface Message {
  type: MessageType;
  message: string;
  additionalText?: string;
  description?: string;
}
export type Messages = Message[];
export default class MessageModel extends BaseModel<Messages> {
  private messages: Messages;
  private numberMessage: number;

  public constructor() {
    super();
    this.messages = [];
    this.numberMessage = this.messages.length;
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
    additionalText?: string,
    description?: string
  ) {
    this.messages.push({
      type: type,
      message: message,
      additionalText: additionalText ?? "",
      description: description ?? "",
    });
    this.numberMessage = this.messages.length;
  }

  public getData(): Messages {
    return this.messages;
  }
  public clearData(): void {
    this.messages = [];
    this.numberMessage = this.messages.length;
  }
  /**
   * Determina la severidad mas alta en los mensajes
   * @returns
   */
  public getHighestSeverity(): MessageType {
    let highestSeverity: MessageType = MessageType.None;

    this.messages.forEach((message) => {
      switch (message.type) {
        case MessageType.Error:
          highestSeverity = MessageType.Error;
          break;
        case MessageType.Warning:
          highestSeverity =
            highestSeverity !== MessageType.Error
              ? MessageType.Warning
              : highestSeverity;
          break;
        case MessageType.Success || MessageType.Information:
          highestSeverity =
            highestSeverity !== MessageType.Error &&
            highestSeverity !== MessageType.Warning
              ? message.type
              : highestSeverity;
          break;
        default:
          highestSeverity = !highestSeverity
            ? MessageType.None
            : highestSeverity;
          break;
      }
    });

    return highestSeverity;
  }
  /**
   * Devuelve el numero de mensajes con una determina criticidad
   * @param severity
   * @returns
   */
  public getNumberMessageSeverity(severity: MessageType) {
    return this.messages.filter((message) => message.type === severity).length;
  }
}
