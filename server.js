const http = require('http');
const express = require('express');
const {WebSocketServer} = require('ws');
const events = require('events');

class Server {
  constructor(){
    this.events = new events();
    this.app_server = express();
    this.app_server.use(express.static('www'));
    this.http_server = http.createServer(this.app_server);
    this.ws_server = new WebSocketServer({ server: this.http_server });
  }
  onHttpServerListening({ port }){
    console.log(`HTTP server listening on port ${port}...`);
    this.events.emit('onHttpServerListening', { port });
  }
  onSocketServerListening({ port }){
    console.log(`Web Socket server listening on port ${port}...`);
    this.events.emit('onSocketServerListening', { port });
  }
  onSocketConnect({ client }){
    this.events.emit('onSocketConnect', { client });
  }
  onSocketMessage({ client, response }){
    const event = JSON.parse(response.toString());
    this.events.emit('onSocketMessage', { client, event });
  }
  getSocketClientByRoom({ user_name, room_name }){
    return Array.from(this.ws_server.clients).find(client => client.user_name === user_name && client.room_name === room_name && client.readyState === 1);
  }
  getSocketClientsByRoom({ room_name }){
    return Array.from(this.ws_server.clients).filter(client => client.room_name === room_name && client.readyState === 1);
  }
  start({ port }){
    this.http_server.listen(port, () => { this.onHttpServerListening({ port }) });
    this.ws_server.on('listening', () => { this.onSocketServerListening({ port }) });
    this.ws_server.on('connection', (client) => {
      this.onSocketConnect({ client });
      client.on('message', (response) => { this.onSocketMessage({ client, response }) } );
    });
  }
}

module.exports = new Server();