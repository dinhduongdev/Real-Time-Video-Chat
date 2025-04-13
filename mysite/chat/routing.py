# myapp/routing.py
from django.urls import re_path
from .consumers import MyConsumer
from .ChatConsumer import ChatConsumer  

websocket_urlpatterns = [
    re_path(r'ws/$', MyConsumer.as_asgi()),
    re_path(r'chat/$', ChatConsumer.as_asgi()),  # Thêm endpoint chat
]
