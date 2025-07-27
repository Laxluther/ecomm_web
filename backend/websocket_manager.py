# backend/websocket_manager.py
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask import request
from datetime import datetime
import json

class WebSocketManager:
    def __init__(self, app):
        self.socketio = SocketIO(
            app, 
            cors_allowed_origins="*",
            async_mode='threading'
        )
        self.connected_clients = {}
        self.setup_events()
        
    def setup_events(self):
        @self.socketio.on('connect')
        def handle_connect():
            client_id = request.sid
            self.connected_clients[client_id] = {
                'connected_at': datetime.now().isoformat()
            }
            print(f"✅ WebSocket Client connected: {client_id}")
            emit('connection_established', {
                'message': 'Real-time updates enabled',
                'client_id': client_id
            })
        
        @self.socketio.on('disconnect')
        def handle_disconnect():
            client_id = request.sid
            if client_id in self.connected_clients:
                del self.connected_clients[client_id]
            print(f"❌ WebSocket Client disconnected: {client_id}")
        
        @self.socketio.on('join_product')
        def handle_join_product(data):
            product_id = data.get('product_id')
            if product_id:
                room = f"product_{product_id}"
                join_room(room)
                print(f"🔍 Client {request.sid} joined product room: {room}")
                emit('joined_room', {
                    'product_id': product_id,
                    'message': f'Watching product {product_id} for updates'
                })
    
    def broadcast_stock_update(self, product_id, stock_data):
        """Send instant stock updates to all watching clients"""
        room = f"product_{product_id}"
        
        update_data = {
            'product_id': product_id,
            'stock': stock_data.get('quantity', 0),
            'in_stock': stock_data.get('quantity', 0) > 0,
            'timestamp': datetime.now().isoformat(),
            'type': 'stock_update'
        }
        
        print(f"📦 Broadcasting stock update for product {product_id}: {update_data['stock']} units")
        
        # Send to all clients watching this product
        self.socketio.emit('stock_updated', update_data, room=room)
        
        # Also send to all connected clients (for general updates)
        self.socketio.emit('global_stock_update', update_data)
    
    def broadcast_review_added(self, product_id, review_data):
        """Send instant review updates to all watching clients"""
        room = f"product_{product_id}"
        
        update_data = {
            'product_id': product_id,
            'review': review_data,
            'timestamp': datetime.now().isoformat(),
            'type': 'new_review'
        }
        
        print(f"⭐ Broadcasting new review for product {product_id}")
        
        self.socketio.emit('review_added', update_data, room=room)
    
    def get_connected_clients_count(self):
        """Get number of connected clients"""
        return len(self.connected_clients)
    
    def get_status(self):
        """Get WebSocket status"""
        return {
            'connected_clients': len(self.connected_clients),
            'status': 'running',
            'clients': list(self.connected_clients.keys())
        }