
# WebRTC Video Chat with Django and Channels

Đây là một ứng dụng WebRTC chat video thời gian thực, sử dụng **Django**, **Channels**, và **WebSocket**. Người dùng có thể tạo kết nối video với nhau và trò chuyện qua WebSocket. Hệ thống này cho phép người dùng tham gia phòng chat, gửi và nhận tin nhắn, cũng như bật/tắt âm thanh và video.

## Features

- **WebRTC Video Call**: Kết nối video trực tiếp giữa người dùng thông qua WebRTC.
- **WebSocket Chat**: Trò chuyện qua WebSocket với khả năng gửi và nhận tin nhắn.
- **Tính năng quản lý âm thanh và video**: Tắt/mở âm thanh và video trong khi gọi.
- **Tính năng nhận diện và kết nối với người dùng khác**: Người dùng có thể kết nối và trao đổi video với nhau thông qua một cơ chế signal WebSocket.

## Tech Stack

- **Backend**: Django, Django Channels
- **Frontend**: HTML, JavaScript (WebRTC)
- **WebSocket**: Dùng WebSocket để giao tiếp giữa client và server
- **Database**: SQLite (hoặc bạn có thể cấu hình cho database khác)
- **Channel Layer**: Redis (dùng để truyền tải dữ liệu giữa các consumer)

## Installation

### 1. Clone repository

```bash
git clone https://github.com/dinhduongdev/Real-Time-Video-Chat.git
cd Real-Time-Video-Chat
```

### 2. Cài đặt các dependency

Cài đặt các package cần thiết trong môi trường ảo (virtual environment):

```bash
python -m venv venv
source venv/bin/activate  # trên macOS/Linux
venv\Scriptsctivate  # trên Windows
```

Cài đặt các thư viện từ `requirements.txt`:

```bash
pip install -r requirements.txt
```

### 3. Áp dụng migrations

Áp dụng các migrations để tạo database:

```bash
python manage.py migrate
```

### 4. Chạy server

Chạy server với Django ASGI:

```bash
daphne myproject.asgi:application
```

Hoặc sử dụng `uvicorn`:

```bash
uvicorn myproject.asgi:application --reload
```

### 7. Truy cập ứng dụng

Truy cập ứng dụng của bạn tại:

```
http://127.0.0.1:8000/
```

## Usage

1. **Tham gia cuộc gọi video**: Nhập tên người dùng và nhấn "Join" để tham gia cuộc gọi video.
2. **Tắt/mở âm thanh và video**: Bạn có thể bật/tắt âm thanh và video bằng các nút tương ứng.
3. **Trò chuyện**: Gửi tin nhắn cho các người dùng khác trong phòng chat.

## File Structure

```
myapp/
    ├── consumers.py        # Định nghĩa các WebSocket consumers
    ├── routing.py          # Định nghĩa URL WebSocket
    ├── models.py           # Các mô hình dữ liệu của Django
    ├── views.py            # Các view xử lý giao diện
    ├── templates/          # Các file HTML của ứng dụng
    ├── static/             # Các file CSS/JS/Assets
    └── __init__.py
myproject/
    ├── asgi.py             # Cấu hình ASGI cho Django Channels
    ├── settings.py         # Cấu hình Django settings
    ├── urls.py             # Các URL của Django
    ├── wsgi.py             # Cấu hình WSGI cho Django
    └── __init__.py
```

## Contributing
PHAM DINH DUONG

## License
