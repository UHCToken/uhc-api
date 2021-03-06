/// <Reference path="../model/model.js"/>
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

const pg = require('pg'),
  exception = require('../exception'),
  ChatRoom = require('../model/ChatRoom'),
  ChatMessage = require('../model/ChatMessage'),
  model = require('../model/model'),
  uhx = require("../uhx"),
  security = require('../security');

/**
 * @class
 * @summary Represents a data access class to the chat tables
 */  
module.exports = class ChatRepository {

  /**
   * @constructor
   * @summary Creates a new instance of the chat repository
   * @param {string} connectionString The connection string to the database to interact with
   */
  constructor(connectionString) {
    this._connectionString = connectionString;
    this.createChatRoom = this.createChatRoom.bind(this);
    this.getChatRoomsPatients = this.getChatRoomsPatients.bind(this);
    this.getChatRoomsProviders = this.getChatRoomsProviders.bind(this);
    this.createChatMessage = this.createChatMessage.bind(this);
    this.getChatMessages = this.getChatMessages.bind(this);
  }

  /**
   * @method
   * @summary creates an individual chat room
   * @param {string} chatRoom The chatroom to be greated
   */
  async createChatRoom(chatRoom) {
    
    const dbc = new pg.Client(this._connectionString);

    try {
      await dbc.connect();
      await dbc.query('INSERT INTO chat_room (title, provider_id, patient_id) VALUES ($1,$2,$3)', 
                              [chatRoom.title || '', chatRoom.providerId, chatRoom.patientId]);
    }
    catch(err){uhx.log.debug(err)}
    finally {
      dbc.end();
    }
  }

  /**
   * @method
   * @summary gets chatrooms associated with specific patient
   * @param {string} userId The user associated with the chat rooms
   */
  async getChatRoomsPatients(userId) {
    const dbc = new pg.Client(this._connectionString);
    try {
      let userChats = [];
      await dbc.connect();
      let userChatsFromDB = await dbc.query(`SELECT cr.id, cr.title, cr.provider_id, cr.patient_id, p.name, pt.given_name, pt.family_name 
                                            FROM public.chat_room as cr 
                                            LEFT JOIN providers as p ON (cr.provider_id = p.id) 
                                            LEFT JOIN patients as pt ON (cr.patient_id = pt.id) 
                                            WHERE cr.patient_id = $1`, [userId])


      for(var r in userChatsFromDB.rows) {
        userChats.push(new ChatRoom().fromData(userChatsFromDB.rows[r]));
      }
        
      return userChats;
    }
    catch(err){console.log(err)}
    finally {
      dbc.end();
    }
  }

   /**
   * @method
   * @summary gets chatrooms associated with specific provider
   * @param {string} userId The user associated with the chat rooms
   */
  async getChatRoomsProviders(userId) {
    const dbc = new pg.Client(this._connectionString);
    try {
      let userChats = [];
      await dbc.connect();
      let userChatsFromDB = await dbc.query(`SELECT cr.id, cr.title, cr.provider_id, cr.patient_id, p.name, pt.given_name, pt.family_name 
                                            FROM public.chat_room as cr 
                                            LEFT JOIN providers as p ON (cr.provider_id = p.id) 
                                            LEFT JOIN patients as pt ON (cr.patient_id = pt.id)
                                            WHERE cr.provider_id = $1`, [userId])


      for(var r in userChatsFromDB.rows) {
        userChats.push(new ChatRoom().fromData(userChatsFromDB.rows[r]));
      }
        
      return userChats;
    }
    catch(err){console.log(err)}
    finally {
      dbc.end();
    }
  }

  /**
   * @method
   * @summary Creates a chat message
   * @param {string} chatRoomId ID of chat room message is associated with
   * @param {string} chatMessage The message that needs to be saved
   */
  async createChatMessage(chatRoomId, chatMessage) {
    const dbc = new pg.Client(this._connectionString);

    try {
      var authorTypeId = await this.getMessageAuthorTypeId(chatRoomId, chatMessage.authorId);
      
      await dbc.connect();


      await dbc.query(`INSERT INTO chat_message (chatroom_id, author_id, datesent, viewedstatus, body, authorname, author_type_id) 
                        VALUES ($1,$2,$3,$4,$5,$6,$7)`, 
                              [chatRoomId, chatMessage.authorId, chatMessage.dateSent, chatMessage.viewedStatus, chatMessage.body, chatMessage.authorName, authorTypeId]);
    }
    catch (err) {
      console.log(`There was an insert error..... ${err}`)
    }
    finally {
      dbc.end();
    }
  }

/**
   * @method
   * @summary Gets Id representing the source of the message author in the chatroom
   * @param {string} chatRoomId Chatroom the author is associated with
   * @param {string} authorId Id of the message author
   */
  async getMessageAuthorTypeId(chatRoomId, authorId) {
    const dbc = new pg.Client(this._connectionString);

    try {
      await dbc.connect();

      let authorTypeId = '';

      let patientQuery = 'select * from public.chat_room where id = $1 and patient_id = $2';
      let patientResult = await dbc.query(patientQuery, [chatRoomId, authorId]);

      let providerQuery = 'select * from public.chat_room where id = $1 and provider_id = $2';
      let providerResult = await dbc.query(providerQuery, [chatRoomId, authorId]);

      if (patientResult.rowCount === 1 && providerResult.rowCount === 0) {
        let idResult = await dbc.query(`SELECT id
        FROM public.author_types
        WHERE type_name = 'patient'`);

        authorTypeId = idResult.rows[0].id;
      }

      if (providerResult.rowCount === 1 && patientResult.rowCount === 0) {
        let idResult = await dbc.query(`SELECT id
        FROM public.author_types
        WHERE type_name = 'provider'`);

        authorTypeId = idResult.rows[0].id;
      }

      dbc.end();

      return authorTypeId;
    }
    catch (err) {
      console.log(err);
    }
    finally {
      dbc.end();
    }
  }

  /**
   * @method
   * @summary gets all chat messages associated with specific chatroom
   * @param {string} chatRoomId ChatID of chat messages are associated with
   */
  async getChatMessages(chatRoomId) {
    const dbc = new pg.Client(this._connectionString);
    try {
      let chatRoomMessages = [];
      await dbc.connect();
      let messagesFromDB = await dbc.query(`SELECT * FROM chat_message 
                                            WHERE chatroom_id = $1
                                            ORDER BY datesent ASC`, [chatRoomId])

      for(var r in messagesFromDB.rows) {
        chatRoomMessages.push(new ChatMessage().fromData(messagesFromDB.rows[r]));
      }

      return chatRoomMessages;
    }
    catch (err) {console.log(err)}
    finally {
      dbc.end();
    }
  }

  /**
   * @method
   * @summary Gets the number of chatroom messages that are unread
   * @param {string} chatRoomId AuthorID that chat messages are associated with
   */
  async getNumberOfUnreadChatRoomMessages(chatroomId, userId) {
    const dbc = new pg.Client(this._connectionString);
    try {
      await dbc.connect();
      let unreadMessages = 0
      let results =  await dbc.query(`
        SELECT Count(*) FROM chat_message 
        WHERE chatroom_id = $1
        AND viewedstatus = 'Unread'
        AND author_id != $2
        `
        , [chatroomId, userId])

      results.rows.forEach(row=> {
        unreadMessages += parseInt(row.count)
      })
      return unreadMessages;
    }
    catch (err) {console.log(err)}
    finally {
      dbc.end();
    }
  }

    /**
   * @method
   * @summary Updates unread chat messages to read
   * @param {string} chatid id of the chat room the message is associated with
   * @param {string} userId user that chat messages are associated with
   */
  async updateChatMessagesToRead(chatid, userId) {
    const dbc = new pg.Client(this._connectionString);
    try {
      await dbc.connect();
      await dbc.query(`UPDATE chat_message  
                      SET viewedstatus = 'Read'
                      WHERE chatroom_id = $1
                      AND author_id = $2
                      `, 
            [chatid, userId]);
    }
    catch (err) {console.log(err)}
    finally {
      dbc.end();
    }

  }

}