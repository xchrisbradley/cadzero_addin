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
import time
from threading import Thread
from . import config


class AuthToken:
    """Stores and manages authentication tokens"""
    
    def __init__(self):
        self.token = None
        self.user_id = None
        self.user_email = None
        self.user_name = None
        self.session_id = None  # Store session ID for token refresh
        self.token_expiry = None  # Track when token expires
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
                    self.session_id = data.get('session_id')
                    
                    # Always decode JWT to get real expiry (in case token was saved with wrong expiry)
                    if self.token:
                        decoded_expiry = self._decode_jwt_expiry(self.token)
                        if decoded_expiry:
                            self.token_expiry = decoded_expiry
                            remaining_minutes = int((decoded_expiry - time.time()) / 60)
                            if remaining_minutes > 0:
                                print(f"[AUTH] Token loaded, expires in ~{remaining_minutes} minutes")
                            else:
                                print(f"[AUTH] Token loaded but already expired")
                        else:
                            # Fallback to saved expiry if we can't decode
                            self.token_expiry = data.get('token_expiry')
                    else:
                        self.token_expiry = data.get('token_expiry')
        except Exception as e:
            print(f"Error loading auth token: {e}")
    
    def _decode_jwt_expiry(self, token):
        """
        Extract the expiry time from a JWT token without verification.
        Returns the expiry timestamp or None if unable to decode.
        """
        try:
            # JWT tokens have 3 parts separated by dots: header.payload.signature
            parts = token.split('.')
            if len(parts) != 3:
                return None
            
            # Decode the payload (second part)
            # Add padding if needed (JWT base64 encoding might not have padding)
            payload = parts[1]
            padding = 4 - len(payload) % 4
            if padding != 4:
                payload += '=' * padding
            
            # Decode from base64
            import base64
            decoded_bytes = base64.urlsafe_b64decode(payload)
            payload_data = json.loads(decoded_bytes)
            
            # Get the 'exp' claim (expiration time as Unix timestamp)
            exp = payload_data.get('exp')
            if exp:
                # Subtract 30 seconds as a buffer to refresh before actual expiry
                return exp - 30
            
            return None
        except Exception as e:
            print(f"[AUTH] Unable to decode JWT expiry: {e}")
            return None
    
    def save_token(self, token, user_id=None, user_email=None, user_name=None, session_id=None, token_expiry=None):
        """Save token to file"""
        try:
            self.token = token
            self.user_id = user_id
            self.user_email = user_email
            self.user_name = user_name
            self.session_id = session_id
            
            # If token_expiry not provided, try to decode it from the JWT token
            if token_expiry is None and token:
                decoded_expiry = self._decode_jwt_expiry(token)
                if decoded_expiry:
                    self.token_expiry = decoded_expiry
                    expiry_minutes = int((decoded_expiry - time.time()) / 60)
                    print(f"[AUTH] Token will expire in ~{expiry_minutes} minutes")
                else:
                    # Fallback: assume 15 minutes (if Clerk Dashboard is configured correctly)
                    self.token_expiry = time.time() + (15 * 60) - 30  # 15 min minus 30 sec buffer
                    print(f"[AUTH] Using default 15-minute token expiry")
            else:
                self.token_expiry = token_expiry
            
            data = {
                'token': token,
                'user_id': user_id,
                'user_email': user_email,
                'user_name': user_name,
                'session_id': session_id,
                'token_expiry': self.token_expiry
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
        self.session_id = None
        self.token_expiry = None
        
        try:
            if os.path.exists(self._token_file):
                os.remove(self._token_file)
        except Exception as e:
            print(f"Error clearing auth token: {e}")
    
    def is_token_expired(self):
        """Check if the current token is expired or about to expire"""
        if self.token_expiry is None:
            return True
        return time.time() >= self.token_expiry
    
    def refresh_token(self):
        """
        Refresh the session token using the session ID.
        
        NOTE: Automatic token refresh is currently disabled. 
        With the extended token lifetime (15 minutes) configured in Clerk Dashboard,
        users should not need to refresh tokens during normal usage.
        If the token expires, users will need to re-authenticate.
        """
        if not self.session_id:
            print("[AUTH] No session ID available for token refresh")
            return False
        
        print("[AUTH] Token refresh requested but automatic refresh is disabled.")
        print("[AUTH] Please extend token lifetime in Clerk Dashboard (recommended: 15 minutes)")
        print("[AUTH] User will need to re-authenticate through the web flow.")
        return False
    
    def is_authenticated(self):
        """Check if user is authenticated"""
        if self.token is None:
            return False
        
        # Check if token is expired
        # NOTE: We don't automatically refresh here anymore to avoid breaking the add-in
        # With extended token lifetime (15 min), this should rarely be an issue
        if self.is_token_expired():
            print("[AUTH] Token expired. Please re-authenticate.")
            print("[AUTH] Tip: Increase token lifetime in Clerk Dashboard to reduce re-authentication frequency")
            return False
        
        return True
    
    def get_auth_header(self):
        """Get the Authorization header for API requests"""
        # Ensure token is valid before returning
        if self.is_authenticated():
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
            'user_name': params.get('user_name', [None])[0],
            'session_id': params.get('session_id', [None])[0]
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
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    background: #1a1a1a;
                    padding: 16px;
                }
                .container {
                    background: #242424;
                    padding: 48px;
                    border-radius: 16px;
                    border: 1px solid #3a3a3a;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                    text-align: center;
                    max-width: 480px;
                    width: 100%;
                }
                .icon-container {
                    margin: 0 auto 24px;
                    height: 64px;
                    width: 64px;
                    background: rgba(16, 185, 129, 0.2);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .checkmark {
                    width: 32px;
                    height: 32px;
                    stroke: #10b981;
                }
                h1 {
                    color: #e5e7eb;
                    font-size: 24px;
                    font-weight: 700;
                    margin-bottom: 16px;
                }
                p {
                    color: #9ca3af;
                    font-size: 16px;
                    line-height: 1.6;
                }
                .footer {
                    margin-top: 24px;
                    padding-top: 24px;
                    border-top: 1px solid #3a3a3a;
                    color: #6b7280;
                    font-size: 14px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="icon-container">
                    <svg class="checkmark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>
                <h1>Authentication Successful!</h1>
                <p>You can now close this window and return to Fusion 360.</p>
                <div class="footer">
                    Your CADZERO add-in is now authenticated and ready to use.
                </div>
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
            user_name=callback_data.get('user_name'),
            session_id=callback_data.get('session_id')
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

