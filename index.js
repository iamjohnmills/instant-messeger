(async () => {
  require('dotenv').config();

  const server = require('./server');

  server.events.on('onSocketMessage', ({ client, event }) => {
    if(event.connect){
      createSocketUser({ client: client, user_name: event.user_name, room_name: event.room_name })
    } else if(event.chat) {
      sendReceiveMessage({ client: client, message: event.message });
    } else if(event.buddylist) {
      sendBuddyList({ client: client });
    }
  });

  const sendBuddyList = ({ client }) => {
    try {
      const buddies = server.getSocketClientsByRoom({ room_name: client.room_name });
      const buddylist = buddies.map(buddy => buddy.user_name);
      return client.send(JSON.stringify({ success: true, buddylist: true, data: { buddies: buddylist } }));
    } catch (error) {
      return client.send(JSON.stringify({ success: false, buddylist: true, error: error.message ? error.message : error }));
    }
  }

  const sendReceiveMessage = ({ client, message }) => {
    try {
      const buddies = server.getSocketClientsByRoom({ room_name: client.room_name }).forEach(buddy => {
        buddy.send(JSON.stringify({ success: true, chat: true, data: { from: client.user_name, message: message } }));
      });
    } catch (error) {
      return client.send(JSON.stringify({ success: false, chat: true, error: error.message ? error.message : error }));
    }
  }

  const createSocketUser = ({ client, user_name, room_name }) => {
    try {
      if(user_name.length > 20) throw 'Username too long.'
      if(room_name.length > 20) throw 'Room name too long.'
      if(client.user_name === user_name && client.room_name === room_name ) throw 'Already in the room.' 
      if( server.getSocketClientByRoom({ user_name, room_name }) ) throw 'Username already exists.'      
      const previous_name = client.user_name && client.room_name === room_name ? client.user_name : null;
      client.user_name = user_name.trim();
      client.room_name = room_name.trim();
      client.send(JSON.stringify({ success: true, connect: true, data: { user_name: user_name, room_name: room_name } }));
      const buddies = server.getSocketClientsByRoom({ room_name: room_name }).forEach(buddy => {
        if(previous_name){
          buddy.send(JSON.stringify({ success: true, name_change: true, data: { from: previous_name, to: user_name } }));
        } else {
          buddy.send(JSON.stringify({ success: true, buddy_join: true, data: { user_name: user_name } }));
        }
      });

    } catch (error) {
      client.send(JSON.stringify({ success: false, connect: true, error: error.message ? error.message : error }));
    }
  }

  server.start({ port: process.env.PORT });

})();

