#!/usr/bin/env python3
"""
E-Commerce Backend Application Runner
"""

from app import create_app
import os

if __name__ == '__main__':
    app = create_app()
    
    # Get port from environment or default to 5000
    port = int(os.environ.get('PORT', 5000))
    
    # Get host from environment or default to localhost
    host = os.environ.get('HOST', '0.0.0.0')
    
    # Run the application
    app.run(
        host=host,
        port=port,
        debug=app.config.get('DEBUG', False)
    )