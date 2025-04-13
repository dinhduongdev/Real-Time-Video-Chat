# myapp/consumers.py
from channels.generic.websocket import AsyncWebsocketConsumer
import json

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        self.channel_name = self.channel_name  # Lưu channel nếu cần
        print(f"Chat connected: {self.channel_name}")

    async def disconnect(self, close_code):
        print(f"Chat disconnected: {self.channel_name}")

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')
        message = data.get('message')

        if action == 'new-message':
            await self.send(text_data=json.dumps({
                'action': 'new-message',
                'message': {
                    'text': message.get('text'),
                    'receiver_channel_name': self.channel_name,
                }
            }))
