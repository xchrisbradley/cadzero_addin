# Application Global Variables
# This module serves as a way to share variables across different
# modules (global variables).

import os

# Flag that indicates to run in Debug mode or not. When running in Debug mode
# more information is written to the Text Command window. Generally, it's useful
# to set this to True while developing an add-in and set it to False when you
# are ready to distribute it.
DEBUG = True

# Gets the name of the add-in from the name of the folder the py file is in.
# This is used when defining unique internal names for various UI elements 
# that need a unique name. It's also recommended to use a company name as 
# part of the ID to better ensure the ID is unique.
ADDIN_NAME = os.path.basename(os.path.dirname(__file__))
COMPANY_NAME = 'Nation Developers'

# Palettes
sample_palette_id = f'{COMPANY_NAME}_{ADDIN_NAME}_palette_id'

# Backend API Endpoints
LOCAL_ENDPOINT = 'http://localhost:4000'
STAGING_ENDPOINT = 'https://staging-utilities-c8p2.encr.app'
PRODUCTION_ENDPOINT = 'https://prod-utilities-c8p2.encr.app'

# Current endpoint (defaults to local)
current_endpoint = PRODUCTION_ENDPOINT

# Clerk Authentication Configuration
CLERK_PUBLISHABLE_KEY = 'pk_test_ZGlzdGluY3QtcGlyYW5oYS04My5jbGVyay5hY2NvdW50cy5kZXYk'  # Replace with your actual key
CLERK_SIGN_IN_URL_LOCAL = 'http://localhost:5173/sign-in'  # Your local frontend sign-in URL
CLERK_SIGN_IN_URL_STAGING = 'https://staging.cadzero.xyz/sign-in'  # Staging frontend sign-in URL
CLERK_SIGN_IN_URL_PRODUCTION = 'https://www.cadzero.xyz/sign-in'  # Production frontend sign-in URL

def get_auth_url():
    """Get the appropriate authentication URL based on current endpoint"""
    # Add callback URL parameter for local callback server
    callback_url = 'http://localhost:8765/'
    
    if current_endpoint == PRODUCTION_ENDPOINT:
        base_url = CLERK_SIGN_IN_URL_PRODUCTION
    elif current_endpoint == STAGING_ENDPOINT:
        base_url = CLERK_SIGN_IN_URL_STAGING
    else:
        base_url = CLERK_SIGN_IN_URL_LOCAL
    
    return f"{base_url}?redirect_url={callback_url}"