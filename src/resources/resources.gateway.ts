import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway(3001, {
  cors: {
    origin: [process.env.FRONTEND_URL],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true,
  },
})
export class ResourcesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log('Client connected: ', client.id);
    client.emit('message', 'Welcome to the WebSocket server!');
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected: ', client.id);
  }

  notifyClients(resource: any) {
    console.log('notifyClients:', resource);
    this.server.emit('resource.update', resource);
  }
}
