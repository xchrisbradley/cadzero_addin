"""
Authentication module for CADZERO using Clerk.
Handles user authentication and token management.
"""

import json
import os
import webbrowser
import http.server
import socketserver
import urllib.parse
from threading import Thread
from . import config


class AuthToken:
    """Stores and manages authentication tokens"""
    
    def __init__(self):
        self.token = None
        self.user_id = None
        self.user_email = None
        self.user_name = None
        self._token_file = os.path.join(
            os.path.dirname(__file__), 
            '.auth_token.json'
        )
        self.load_token()
    
    def load_token(self):
        """Load token from file if it exists"""
        try:
            if os.path.exists(self._token_file):
                with open(self._token_file, 'r') as f:
                    data = json.load(f)
                    self.token = data.get('token')
                    self.user_id = data.get('user_id')
                    self.user_email = data.get('user_email')
                    self.user_name = data.get('user_name')
        except Exception as e:
            print(f"Error loading auth token: {e}")
    
    def save_token(self, token, user_id=None, user_email=None, user_name=None):
        """Save token to file"""
        try:
            self.token = token
            self.user_id = user_id
            self.user_email = user_email
            self.user_name = user_name
            
            data = {
                'token': token,
                'user_id': user_id,
                'user_email': user_email,
                'user_name': user_name
            }
            
            with open(self._token_file, 'w') as f:
                json.dump(data, f)
        except Exception as e:
            print(f"Error saving auth token: {e}")
    
    def clear_token(self):
        """Clear the stored token"""
        self.token = None
        self.user_id = None
        self.user_email = None
        self.user_name = None
        
        try:
            if os.path.exists(self._token_file):
                os.remove(self._token_file)
        except Exception as e:
            print(f"Error clearing auth token: {e}")
    
    def is_authenticated(self):
        """Check if user is authenticated"""
        return self.token is not None
    
    def get_auth_header(self):
        """Get the Authorization header for API requests"""
        if self.token:
            return {'Authorization': f'Bearer {self.token}'}
        return {}


# Global auth token instance
auth_token = AuthToken()


class CallbackHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP server handler to receive OAuth callback"""
    
    callback_data = {}
    
    def do_GET(self):
        """Handle GET request from OAuth callback"""
        # Parse the query parameters
        parsed_path = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed_path.query)
        
        # Debug logging
        print(f"[AUTH] Callback received on path: {self.path}")
        print(f"[AUTH] Parsed params: token={bool(params.get('token'))}, user_id={params.get('user_id', [None])[0]}")
        
        # Store the callback data
        CallbackHandler.callback_data = {
            'token': params.get('token', [None])[0],
            'user_id': params.get('user_id', [None])[0],
            'user_email': params.get('user_email', [None])[0],
            'user_name': params.get('user_name', [None])[0]
        }
        
        # Debug log the token
        token = CallbackHandler.callback_data.get('token')
        if token:
            print(f"[AUTH] Token received: {token[:20]}... (length: {len(token)})")
        else:
            print("[AUTH] ERROR: No token received in callback!")
        
        # Send response to browser
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        
        success_html = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Authentication Successful</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                }
                .container {
                    background: white;
                    padding: 48px;
                    border-radius: 16px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    text-align: center;
                    max-width: 400px;
                }
                h1 {
                    color: #10b981;
                    font-size: 32px;
                    margin-bottom: 16px;
                }
                p {
                    color: #64748b;
                    font-size: 16px;
                    line-height: 1.6;
                }
                .checkmark {
                    font-size: 64px;
                    margin-bottom: 24px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="checkmark">✅</div>
                <h1>Authentication Successful!</h1>
                <p>You can now close this window and return to Fusion 360.</p>
            </div>
        </body>
        </html>
        """
        
        self.wfile.write(success_html.encode())
    
    def log_message(self, format, *args):
        """Suppress server logs"""
        pass


def start_auth_server(port=8765):
    """Start a local HTTP server to receive OAuth callback"""
    handler = CallbackHandler
    with socketserver.TCPServer(("", port), handler) as httpd:
        # Handle only one request
        httpd.handle_request()
        return CallbackHandler.callback_data


def initiate_clerk_signin():
    """
    Initiate the Clerk sign-in flow.
    Opens a browser window for authentication and waits for callback.
    """
    print("[AUTH] Starting Clerk sign-in flow...")
    
    # Get the authentication URL from config
    auth_url = config.get_auth_url()
    print(f"[AUTH] Auth URL: {auth_url}")
    
    # Start callback server in a thread
    callback_port = 8765
    callback_data = {}
    
    def run_server():
        nonlocal callback_data
        print(f"[AUTH] Starting callback server on port {callback_port}...")
        callback_data = start_auth_server(callback_port)
        print(f"[AUTH] Callback server received data: token={bool(callback_data.get('token'))}")
    
    server_thread = Thread(target=run_server, daemon=True)
    server_thread.start()
    
    # Small delay to ensure server is ready
    import time
    time.sleep(0.5)
    
    # Open browser for authentication
    print("[AUTH] Opening browser...")
    webbrowser.open(auth_url)
    
    # Wait for server thread to complete (with timeout)
    print("[AUTH] Waiting for authentication callback...")
    server_thread.join(timeout=300)  # 5 minute timeout
    
    # Process callback data
    if callback_data.get('token'):
        print("[AUTH] Token received successfully, saving...")
        auth_token.save_token(
            token=callback_data['token'],
            user_id=callback_data.get('user_id'),
            user_email=callback_data.get('user_email'),
            user_name=callback_data.get('user_name')
        )
        print(f"[AUTH] Authentication successful for: {callback_data.get('user_email')}")
        return True
    else:
        print("[AUTH] ERROR: No token received from callback")
        return False


def sign_out():
    """Sign out the current user"""
    auth_token.clear_token()


def get_current_user():
    """Get current user information"""
    if auth_token.is_authenticated():
        return {
            'user_id': auth_token.user_id,
            'user_email': auth_token.user_email,
            'user_name': auth_token.user_name,
            'is_authenticated': True
        }
    return {
        'is_authenticated': False
    }


def get_auth_headers():
    """Get authentication headers for API requests"""
    return auth_token.get_auth_header()

