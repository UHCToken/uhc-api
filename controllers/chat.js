'use strict';

/**
 * Copyright 2018 Universal Health Coin
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS 
 * IN THE SOFTWARE.
 * 
 * Developed on behalf of Universal Health Coin by the Mohawk mHealth & eHealth Development & Innovation Centre (MEDIC)
 */

const ChatMessage = require('../model/ChatMessage'),
  ChatRoom = require('../model/ChatRoom'),
  http = require('http'),
  https = require('https'),
  security = require('../security'),
  exception = require('../exception'),
  uhx = require('../uhx');

  let io;
/**
 * @class
 * @summary Represents Chat Object, with socket.io for listening, and routes for getting/creating chatrooms and chats
 */
module.exports.ChatApiResource = class ChatApiResource {

  get routes() {
    return {
      permission_group: "user",
      routes: [
        {
          "path": "chat/provider/:uid",
          "get" : {
              demand: security.PermissionType.READ,
              method: this.getChatRoomsProviders
          }
        },
        {
          "path": "chat/patient/:uid",
          "get" : {
              demand: security.PermissionType.READ,
              method: this.getChatRoomsPatients
          }
        },
        {
          "path": "chat",
          "post" : {
              demand: security.PermissionType.LIST,
              method: this.createChatRoom
          }
        },
        {
          "path": "chat/:cid/messages",
          "get" : {
              demand: security.PermissionType.READ,
              method: this.getChatMessages
          },
          "post": {
            demand: security.PermissionType.READ,
            method: this.createChatMessage
          }
        },
        {
          "path": "chat/:cid/unread",
          "get" : {
              demand: security.PermissionType.READ,
              method: this.getUnreadMessageNumber
          },
          "put": {
            "demand": security.PermissionType.WRITE | security.PermissionType.READ,
            "method": this.updateUnreadMessages
          }
        }
      ]
    }  
  }



  /**
   * @method
   * @summary Get a list of chatrooms that a provider is a part of 
   * @param {Express.Request} req http req from the client
   * @param {Express.Response} res The HTTP response going to the client
   */
  async getChatRoomsProviders(req, res) {
    if(!req.params.uid)
        throw new exception.Exception("Missing chat user id parameter", exception.ErrorCodes.MISSING_PROPERTY);
        
    res.status(200).json(await uhx.Repositories.chatRepository.getChatRoomsProviders(req.params.uid));
    return true;
  }

    /**
   * @method
   * @summary Get a list of chatrooms that a patient is a part of 
   * @param {Express.Request} req http req from the client
   * @param {Express.Response} res The HTTP response going to the client
   */
  async getChatRoomsPatients(req, res) {
    if(!req.params.uid)
        throw new exception.Exception("Missing chat user id parameter", exception.ErrorCodes.MISSING_PROPERTY);

    res.status(200).json(await uhx.Repositories.chatRepository.getChatRoomsPatients(req.params.uid));
    return true;
  }

  /**
   * @method
   * @summary Creates a new chat room
   * @param {Express.Request} req The HTTP request fromthis client
   * @param {Express.Response} res The HTTP response going to the client
   */
  async createChatRoom(req, res) {
    if(!req.body)
      throw new exception.Exception("Missing body", exception.ErrorCodes.MISSING_PAYLOAD);

    res.status(201).json(await uhx.Repositories.chatRepository.createChatRoom(req.body.chatRoom));
    return true;
  }

  /**
   * @method
   * @summary Gets chat messages associated with a particular chat room
   * @param {Express.Request} req http req from the client
   * @param {Express.Response} res The HTTP response going to the client
   */
  async getChatMessages(req, res) {
    if(!req.params.cid)
        throw new exception.Exception("Missing chat room id parameter", exception.ErrorCodes.MISSING_PROPERTY);

    try {
      res.status(200).json(await uhx.Repositories.chatRepository.getChatMessages(req.params.cid));
      return true;
    }
    catch (e) {
      throw new exception.Exception('There is an error.... ', exception.ErrorCodes.UNKNOWN);
    }
  }

  /**
   * @method
   * @summary Creates a new chat message
   * @param {Express.Request} req http req from the client
   * @param {Express.Response} res The HTTP response going to the client
   */
  async createChatMessage(req, res) {
    if(!req.body)
      throw new exception.Exception("Missing body", exception.ErrorCodes.MISSING_PAYLOAD);

    let chatRoomId = req.body.chatRoomId;
    let chatMessage = req.body
    try {
      res.status(201).json(await uhx.Repositories.chatRepository.createChatMessage(chatRoomId, chatMessage));
      return true;
    }
    catch (e) {
      throw new exception.Exception(`Error: ${e}`, exception.ErrorCodes.UNKNOWN);
    }
  }

  /**
   * @method
   * @summary Gets the number of unread messages per chatroom
   * @param {Express.Request} req http req from the client
   * @param {Express.Response} res The HTTP response going to the client
   */
  async getUnreadMessageNumber(req, res) {
    const chatId = req.params.cid;
    const userId = req.headers.userid;

    if(!chatId)
      throw new exception.Exception("Missing chat room id parameter", exception.ErrorCodes.MISSING_PROPERTY);

    if(!userId)
      throw new exception.Exception("Missing user id parameter", exception.ErrorCodes.MISSING_PROPERTY);


    try {
      res.status(200).json(await uhx.Repositories.chatRepository.getNumberOfUnreadChatRoomMessages(chatId, userId));
      return true;
    }
    catch (e) {
      throw new exception.Exception(`Error: ${e}`, exception.ErrorCodes.UNKNOWN);
    }
  }

  /**
   * @method
   * @summary Updates chat rooms from unread to read
   * @param {Express.Request} req http req from the client
   * @param {Express.Response} res The HTTP response going to the client
   */
  async updateUnreadMessages(req, res) {
    const chatId = req.params.cid;
    const userId = req.headers.userid; //userid of other user in chat (not one signed in)

    if(!chatId)
    throw new exception.Exception("Missing chat room id parameter", exception.ErrorCodes.MISSING_PROPERTY);

    if(!userId)
      throw new exception.Exception("Missing user id parameter", exception.ErrorCodes.MISSING_PROPERTY);

    try {
      res.status(200).json(await uhx.Repositories.chatRepository.updateChatMessagesToRead(chatId, userId));
      return true;
    }
    catch (e) {
      throw new exception.Exception(`Error: ${e}`, exception.ErrorCodes.UNKNOWN);
    }
  }
}
