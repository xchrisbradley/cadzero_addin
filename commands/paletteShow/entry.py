import json
import adsk.core
import adsk.fusion
import os
import urllib.request
import urllib.parse
import threading
import time
from ...lib import fusionAddInUtils as futil
from ... import config
from ... import auth
from datetime import datetime

app = adsk.core.Application.get()
ui = app.userInterface

# Get the backend URL from config
def get_backend_url():
    """Get the current backend URL from config"""
    return config.current_endpoint

def get_chat_endpoint():
    """Get the current chat endpoint"""
    return f"{get_backend_url()}/llm/chat-with-tools"

# CADZERO Palette Configuration
CMD_ID = f'{config.COMPANY_NAME}_{config.ADDIN_NAME}_PalleteShow'
CMD_NAME = 'CADZERO Chat'
CMD_Description = 'AI-Powered Fusion 360 Assistant'
PALETTE_NAME = 'CADZERO'
IS_PROMOTED = False

# Using "global" variables by referencing values from /config.py
PALETTE_ID = config.sample_palette_id

# Specify the full path to the local html. You can also use a web URL
# such as 'https://www.autodesk.com/'
PALETTE_URL = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'resources', 'html', 'index.html')

# The path function builds a valid OS path. This fixes it to be a valid local URL.
PALETTE_URL = PALETTE_URL.replace('\\', '/')

# Set a default docking behavior for the palette
PALETTE_DOCKING = adsk.core.PaletteDockingStates.PaletteDockStateRight

# TODO *** Define the location where the command button will be created. ***
# This is done by specifying the workspace, the tab, and the panel, and the 
# command it will be inserted beside. Not providing the command to position it
# will insert it at the end.
WORKSPACE_ID = 'FusionSolidEnvironment'
PANEL_ID = 'SolidScriptsAddinsPanel'
COMMAND_BESIDE_ID = 'ScriptsManagerCommand'

# Resource location for command icons, here we assume a sub folder in this directory named "resources".
ICON_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'resources', '')

# Local list of event handlers used to maintain a reference so
# they are not released and garbage collected.
local_handlers = []

# Custom event for executing Python code in the main thread
CUSTOM_EVENT_ID = f'{config.COMPANY_NAME}_{config.ADDIN_NAME}_ExecutePythonCode'
custom_event = None
python_execution_results = {}
python_execution_lock = threading.Lock()
python_execution_counter = 0


# Executed when add-in is run.
def start():
    global custom_event
    
    # Register custom event for executing Python code in main thread
    custom_event = app.registerCustomEvent(CUSTOM_EVENT_ID)
    futil.add_handler(custom_event, custom_event_handler)
    futil.log(f'{CMD_NAME}: Registered custom event: {CUSTOM_EVENT_ID}')
    
    # Create a command Definition.
    cmd_def = ui.commandDefinitions.addButtonDefinition(CMD_ID, CMD_NAME, CMD_Description, ICON_FOLDER)

    # Add command created handler. The function passed here will be executed when the command is executed.
    futil.add_handler(cmd_def.commandCreated, command_created)

    # ******** Add a button into the UI so the user can run the command. ********
    # Get the target workspace the button will be created in.
    workspace = ui.workspaces.itemById(WORKSPACE_ID)

    # Get the panel the button will be created in.
    panel = workspace.toolbarPanels.itemById(PANEL_ID)

    # Create the button command control in the UI after the specified existing command.
    control = panel.controls.addCommand(cmd_def, COMMAND_BESIDE_ID, False)

    # Specify if the command is promoted to the main toolbar. 
    control.isPromoted = IS_PROMOTED


# Executed when add-in is stopped.
def stop():
    global custom_event
    
    # Unregister custom event
    if custom_event:
        app.unregisterCustomEvent(CUSTOM_EVENT_ID)
        custom_event = None
        futil.log(f'{CMD_NAME}: Unregistered custom event: {CUSTOM_EVENT_ID}')
    
    # Get the various UI elements for this command
    workspace = ui.workspaces.itemById(WORKSPACE_ID)
    panel = workspace.toolbarPanels.itemById(PANEL_ID)
    command_control = panel.controls.itemById(CMD_ID)
    command_definition = ui.commandDefinitions.itemById(CMD_ID)
    palette = ui.palettes.itemById(PALETTE_ID)

    # Delete the button command control
    if command_control:
        command_control.deleteMe()

    # Delete the command definition
    if command_definition:
        command_definition.deleteMe()

    # Delete the Palette
    if palette:
        palette.deleteMe()


# Event handler that is called when the user clicks the command button in the UI.
# To have a dialog, you create the desired command inputs here. If you don't need
# a dialog, don't create any inputs and the execute event will be immediately fired.
# You also need to connect to any command related events here.
def command_created(args: adsk.core.CommandCreatedEventArgs):
    # General logging for debug.
    futil.log(f'{CMD_NAME}: Command created event.')

    # Create the event handlers you will need for this instance of the command
    futil.add_handler(args.command.execute, command_execute, local_handlers=local_handlers)
    futil.add_handler(args.command.destroy, command_destroy, local_handlers=local_handlers)


# Because no command inputs are being added in the command created event, the execute
# event is immediately fired.
def command_execute(args: adsk.core.CommandEventArgs):
    # General logging for debug.
    futil.log(f'{CMD_NAME}: Command execute event.')

    palettes = ui.palettes
    palette = palettes.itemById(PALETTE_ID)
    if palette is None:
        palette = palettes.add(
            id=PALETTE_ID,
            name=PALETTE_NAME,
            htmlFileURL=PALETTE_URL,
            isVisible=True,
            showCloseButton=False,
            isResizable=True,
            width=700,
            height=650,
            useNewWebBrowser=True
        )
        futil.add_handler(palette.closed, palette_closed)
        futil.add_handler(palette.navigatingURL, palette_navigating)
        futil.add_handler(palette.incomingFromHTML, palette_incoming)
        futil.log(f'{CMD_NAME}: Created a new palette: ID = {palette.id}, Name = {palette.name}')

    if palette.dockingState == adsk.core.PaletteDockingStates.PaletteDockStateFloating:
        palette.dockingState = PALETTE_DOCKING

    palette.isVisible = True


# Use this to handle a user closing your palette.
def palette_closed(args: adsk.core.UserInterfaceGeneralEventArgs):
    # General logging for debug.
    futil.log(f'{CMD_NAME}: Palette was closed.')


# Use this to handle a user navigating to a new page in your palette.
def palette_navigating(args: adsk.core.NavigationEventArgs):
    # General logging for debug.
    futil.log(f'{CMD_NAME}: Palette navigating event.')

    # Get the URL the user is navigating to:
    url = args.navigationURL

    log_msg = f"User is attempting to navigate to {url}\n"
    futil.log(log_msg, adsk.core.LogLevels.InfoLogLevel)

    # Check if url is an external site and open in user's default browser.
    if url.startswith("http"):
        args.launchExternally = True


# Use this to handle events sent from javascript in your palette.
def palette_incoming(html_args: adsk.core.HTMLEventArgs):
    # General logging for debug.
    futil.log(f'{CMD_NAME}: Palette incoming event.')

    message_data: dict = json.loads(html_args.data)
    message_action = html_args.action

    log_msg = f"Event received from {html_args.firingEvent.sender.name}\n"
    log_msg += f"Action: {message_action}\n"
    log_msg += f"Data: {message_data}"
    futil.log(log_msg, adsk.core.LogLevels.InfoLogLevel)

    # Handle commands from the palette
    if message_action == 'commandFromPalette':
        command = message_data.get('command', '')
        params = message_data.get('params', {})
        
        try:
            result = execute_command(command, params)
            html_args.returnData = json.dumps({
                'success': True,
                'message': result
            })
        except Exception as e:
            futil.log(f'Error executing command: {str(e)}', adsk.core.LogLevels.ErrorLogLevel)
            html_args.returnData = json.dumps({
                'success': False,
                'message': str(e)
            })
    elif message_action == 'chatMessage':
        message = message_data.get('message', '')
        history = message_data.get('history', [])
        
        # Return immediately to prevent UI blocking
        html_args.returnData = json.dumps({
            'success': True,
            'response': 'Thinking...',
            'status': 'processing'
        })
        
        # Process the chat message asynchronously in a separate thread
        def process_chat_async():
            try:
                response = send_chat_message(message, history)
                
                # Handle the new response format with tool calls
                if isinstance(response, dict):
                    # New format with tool calls and execution results
                    main_response = response.get('response', '')
                    tool_calls = response.get('tool_calls', [])
                    tool_outputs = response.get('tool_outputs', [])
                    execution_results = response.get('execution_results', [])
                    
                    # Send the response back to the UI asynchronously
                    send_response_to_ui({
                        'success': True,
                        'response': main_response,
                        'tool_calls': tool_calls,
                        'execution_results': execution_results
                    })
                else:
                    # Legacy format (fallback)
                    send_response_to_ui({
                        'success': True,
                        'response': response
                    })
                    
            except Exception as e:
                futil.log(f'Error sending chat message: {str(e)}', adsk.core.LogLevels.ErrorLogLevel)
                send_response_to_ui({
                    'success': False,
                    'error': str(e)
                })
        
        # Start the async processing in a separate thread
        thread = threading.Thread(target=process_chat_async, daemon=True)
        thread.start()
    elif message_action == 'switchEndpoint':
        endpoint_type = message_data.get('endpoint', 'local')
        
        if endpoint_type == 'staging':
            config.current_endpoint = config.STAGING_ENDPOINT
            futil.log(f'Switched to staging endpoint: {config.STAGING_ENDPOINT}', adsk.core.LogLevels.InfoLogLevel)
            html_args.returnData = json.dumps({
                'success': True,
                'endpoint': 'staging',
                'url': config.STAGING_ENDPOINT
            })
        else:
            config.current_endpoint = config.LOCAL_ENDPOINT
            futil.log(f'Switched to local endpoint: {config.LOCAL_ENDPOINT}', adsk.core.LogLevels.InfoLogLevel)
            html_args.returnData = json.dumps({
                'success': True,
                'endpoint': 'local',
                'url': config.LOCAL_ENDPOINT
            })
    elif message_action == 'getEndpoint':
        # Return the current endpoint
        is_staging = config.current_endpoint == config.STAGING_ENDPOINT
        html_args.returnData = json.dumps({
            'success': True,
            'endpoint': 'staging' if is_staging else 'local',
            'url': config.current_endpoint
        })
    elif message_action == 'signIn':
        # Handle sign-in request - start async process
        try:
            futil.log('Initiating sign-in flow...', adsk.core.LogLevels.InfoLogLevel)
            
            # Return immediately to not block the UI
            html_args.returnData = json.dumps({
                'success': True,
                'message': 'Opening browser for authentication...',
                'status': 'processing'
            })
            
            # Start sign-in in a separate thread
            def sign_in_async():
                try:
                    success = auth.initiate_clerk_signin()
                    
                    if success:
                        user = auth.get_current_user()
                        futil.log(f'User signed in: {user.get("user_email")}', adsk.core.LogLevels.InfoLogLevel)
                        
                        # Send success response back to UI
                        send_response_to_ui({
                            'action': 'authComplete',
                            'success': True,
                            'message': 'Successfully signed in',
                            'user': user
                        })
                    else:
                        futil.log('Sign-in failed', adsk.core.LogLevels.WarningLogLevel)
                        
                        # Send failure response back to UI
                        send_response_to_ui({
                            'action': 'authComplete',
                            'success': False,
                            'message': 'Sign-in failed or was cancelled'
                        })
                except Exception as e:
                    futil.log(f'Sign-in error: {str(e)}', adsk.core.LogLevels.ErrorLogLevel)
                    
                    # Send error response back to UI
                    send_response_to_ui({
                        'action': 'authComplete',
                        'success': False,
                        'message': f'Sign-in error: {str(e)}'
                    })
            
            # Start async thread
            thread = threading.Thread(target=sign_in_async, daemon=True)
            thread.start()
            
        except Exception as e:
            futil.log(f'Sign-in error: {str(e)}', adsk.core.LogLevels.ErrorLogLevel)
            html_args.returnData = json.dumps({
                'success': False,
                'message': f'Sign-in error: {str(e)}'
            })
    elif message_action == 'signOut':
        # Handle sign-out request
        try:
            auth.sign_out()
            html_args.returnData = json.dumps({
                'success': True,
                'message': 'Successfully signed out'
            })
            futil.log('User signed out', adsk.core.LogLevels.InfoLogLevel)
        except Exception as e:
            futil.log(f'Sign-out error: {str(e)}', adsk.core.LogLevels.ErrorLogLevel)
            html_args.returnData = json.dumps({
                'success': False,
                'message': f'Sign-out error: {str(e)}'
            })
    elif message_action == 'getAuthStatus':
        # Return current authentication status
        try:
            user = auth.get_current_user()
            html_args.returnData = json.dumps({
                'success': True,
                'user': user
            })
        except Exception as e:
            futil.log(f'Error getting auth status: {str(e)}', adsk.core.LogLevels.ErrorLogLevel)
            html_args.returnData = json.dumps({
                'success': False,
                'message': f'Error: {str(e)}'
            })
    else:
        # Return value.
        now = datetime.now()
        currentTime = now.strftime('%H:%M:%S')
        html_args.returnData = f'OK - {currentTime}'


def send_response_to_ui(response_data):
    """Send response back to the UI asynchronously"""
    try:
        # Get the palette to send data back to the UI
        palettes = ui.palettes
        palette = palettes.itemById(PALETTE_ID)
        
        if palette:
            # Extract action from response data, default to chatResponse for backward compatibility
            action = response_data.get('action', 'chatResponse')
            
            # Create a copy of the data without the action key
            data_to_send = {k: v for k, v in response_data.items() if k != 'action'}
            
            # Send the response data to the UI
            palette.sendInfoToHTML(action, json.dumps(data_to_send))
            futil.log(f'Sent {action} to UI', adsk.core.LogLevels.InfoLogLevel)
        else:
            futil.log('Palette not found, cannot send response to UI', adsk.core.LogLevels.ErrorLogLevel)
            
    except Exception as e:
        futil.log(f'Error sending response to UI: {str(e)}', adsk.core.LogLevels.ErrorLogLevel)


def execute_command(command, params):
    """Execute a command from the palette"""
    futil.log(f'Executing command: {command} with params: {params}')
    
    # Get the active design and root component
    des = app.activeProduct
    if not des:
        return "No active design"
    
    root = des.rootComponent
    if not root:
        return "No root component"
    
    # Execute based on command type
    if command == 'createBox':
        return create_box(root, params)
    elif command == 'createCylinder':
        return create_cylinder(root, params)
    elif command == 'createSphere':
        return create_sphere(root, params)
    elif command == 'createCone':
        return create_cone(root, params)
    else:
        return f"Unknown command: {command}"


def create_box(root, params):
    """Create a box primitive"""
    try:
        length = params.get('length', 10)
        width = params.get('width', 10)
        height = params.get('height', 10)
        
        # Create a sketch on the X-Y plane
        sketch = root.sketches.add(root.xYConstructionPlane)
        
        # Create a rectangle
        rect = sketch.sketchCurves.sketchLines.addTwoPointRectangle(
            adsk.core.Point3D.create(0, 0, 0),
            adsk.core.Point3D.create(length, width, 0)
        )
        
        # Get the profile
        prof = sketch.profiles.item(0)
        
        # Create extrude input
        extrudes = root.features.extrudeFeatures
        ext_input = extrudes.createInput(prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
        distance = adsk.core.ValueInput.createByReal(height)
        ext_input.setDistanceExtent(False, distance)
        
        # Create the extruded body
        extrudes.add(ext_input)
        
        return f"Created box: {length}x{width}x{height}"
    except Exception as e:
        return f"Error creating box: {str(e)}"


def create_cylinder(root, params):
    """Create a cylinder primitive"""
    try:
        radius = params.get('radius', 5)
        height = params.get('height', 10)
        
        # Create a sketch on the X-Y plane
        sketch = root.sketches.add(root.xYConstructionPlane)
        
        # Create a circle
        circles = sketch.sketchCurves.sketchCircles
        circle = circles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), radius)
        
        # Get the profile
        prof = sketch.profiles.item(0)
        
        # Create extrude input
        extrudes = root.features.extrudeFeatures
        ext_input = extrudes.createInput(prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
        distance = adsk.core.ValueInput.createByReal(height)
        ext_input.setDistanceExtent(False, distance)
        
        # Create the extruded body
        extrudes.add(ext_input)
        
        return f"Created cylinder: r={radius}, h={height}"
    except Exception as e:
        return f"Error creating cylinder: {str(e)}"


def create_sphere(root, params):
    """Create a sphere primitive"""
    try:
        radius = params.get('radius', 5)
        
        # Create a sketch on the X-Y plane
        sketch = root.sketches.add(root.xYConstructionPlane)
        
        # Create a circle
        circles = sketch.sketchCurves.sketchCircles
        circle = circles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), radius)
        
        # Get the profile
        prof = sketch.profiles.item(0)
        
        # Create revolve input
        revolves = root.features.revolveFeatures
        rev_input = revolves.createInput(
            prof,
            adsk.fusion.FeatureOperations.NewBodyFeatureOperation
        )
        
        # Create an axis for the revolve (Y-axis)
        axis = root.constructionAxes.createByTwoPoints(
            adsk.core.Point3D.create(0, -radius, 0),
            adsk.core.Point3D.create(0, radius, 0)
        )
        rev_input.setAngleExtent(False, adsk.core.ValueInput.createByString('360 deg'))
        rev_input.participantBodies = [axis]
        
        # Create the revolved body
        revolves.add(rev_input)
        
        return f"Created sphere: r={radius}"
    except Exception as e:
        return f"Error creating sphere: {str(e)}"


def create_cone(root, params):
    """Create a cone primitive"""
    try:
        top_radius = params.get('topRadius', 2)
        bottom_radius = params.get('bottomRadius', 5)
        height = params.get('height', 10)
        
        # Create a sketch on the X-Y plane
        sketch = root.sketches.add(root.xYConstructionPlane)
        
        # Create the cone profile using sketch lines
        lines = sketch.sketchCurves.sketchLines
        point1 = adsk.core.Point3D.create(0, 0, 0)
        point2 = adsk.core.Point3D.create(bottom_radius, 0, 0)
        point3 = adsk.core.Point3D.create(top_radius, height, 0)
        point4 = adsk.core.Point3D.create(0, height, 0)
        
        line1 = lines.addByTwoPoints(point1, point2)
        line2 = lines.addByTwoPoints(point2, point3)
        line3 = lines.addByTwoPoints(point3, point4)
        line4 = lines.addByTwoPoints(point4, point1)
        
        # Get the profile
        prof = sketch.profiles.item(0)
        
        # Create revolve input
        revolves = root.features.revolveFeatures
        rev_input = revolves.createInput(
            prof,
            adsk.fusion.FeatureOperations.NewBodyFeatureOperation
        )
        
        # Create an axis for the revolve
        axis = root.constructionAxes.createByTwoPoints(
            point1,
            point4
        )
        rev_input.setAngleExtent(False, adsk.core.ValueInput.createByString('360 deg'))
        rev_input.participantBodies = [axis]
        
        # Create the revolved body
        revolves.add(rev_input)
        
        return f"Created cone: top_r={top_radius}, bottom_r={bottom_radius}, h={height}"
    except Exception as e:
        return f"Error creating cone: {str(e)}"


def custom_event_handler(args: adsk.core.CustomEventArgs):
    """Handle custom event to execute Python code in the main thread."""
    global python_execution_results
    
    try:
        # Parse the event data
        event_data = json.loads(args.additionalInfo)
        execution_id = event_data.get('execution_id')
        python_code = event_data.get('python_code', '')
        
        futil.log(f'Custom event handler: Executing Python code (ID: {execution_id})', adsk.core.LogLevels.InfoLogLevel)
        
        if not python_code:
            python_execution_results[execution_id] = {
                'success': False,
                'message': 'No Python code provided',
                'error': None
            }
            return
        
        # Make sure a command isn't running before changes are made (per Fusion docs)
        if ui.activeCommand != 'SelectCommand':
            ui.commandDefinitions.itemById('SelectCommand').execute()
        
        # Prepare the execution environment
        exec_globals = {
            'adsk': adsk,
            'app': app,
            'ui': ui,
            '__name__': '__main__',
            '__cadzero_result__': None  # Variable to capture result from Python code
        }
        
        # Execute the Python code in the main thread
        exec(python_code, exec_globals)
        
        # Allow Fusion to process messages and update display
        adsk.doEvents()
        
        # Capture result from Python code if it was set
        captured_result = exec_globals.get('__cadzero_result__')
        
        # Mark as successful with captured result
        python_execution_results[execution_id] = {
            'success': True,
            'message': 'Python code executed successfully',
            'result': captured_result if captured_result is not None else 'Execution completed',
            'error': None
        }
        
        futil.log(f'Custom event handler: Python code executed successfully (ID: {execution_id})', adsk.core.LogLevels.InfoLogLevel)
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        futil.log(f'Custom event handler error: {error_details}', adsk.core.LogLevels.ErrorLogLevel)
        
        execution_id = None
        try:
            event_data = json.loads(args.additionalInfo)
            execution_id = event_data.get('execution_id')
        except:
            pass
        
        if execution_id:
            error_message = f'Error executing Python code: {str(e)}\n\nDetails:\n{error_details}'
            python_execution_results[execution_id] = {
                'success': False,
                'message': error_message,
                'result': error_message,  # Include error as result so it shows in chat
                'error': error_details
            }


def execute_tool_calls_sequentially(tool_calls, tool_outputs):
    """Execute tool calls sequentially in Fusion 360 using custom events."""
    global python_execution_counter, python_execution_results
    
    execution_results = []
    
    futil.log(f'Executing {len(tool_calls)} tool calls sequentially using custom events', adsk.core.LogLevels.InfoLogLevel)
    
    for i, (tool_call, tool_output) in enumerate(zip(tool_calls, tool_outputs)):
        try:
            futil.log(f'Executing tool call {i+1}/{len(tool_calls)}: {tool_call.get("name", "unknown")}', adsk.core.LogLevels.InfoLogLevel)
            
            # Parse the tool output to extract Python code
            tool_output_data = json.loads(tool_output.get('output', '{}'))
            python_code = tool_output_data.get('python_code', '')
            
            if python_code:
                futil.log(f'Found Python code for tool call {i+1}, executing via custom event...', adsk.core.LogLevels.InfoLogLevel)
                
                # Generate unique execution ID
                python_execution_counter += 1
                execution_id = f'exec_{python_execution_counter}_{int(time.time())}'
                
                # Prepare event data
                event_data = {
                    'execution_id': execution_id,
                    'python_code': python_code,
                    'tool_name': tool_call.get('name', 'unknown')
                }
                
                # Initialize result slot
                with python_execution_lock:
                    python_execution_results[execution_id] = None
                
                # Fire custom event to execute in main thread
                app.fireCustomEvent(CUSTOM_EVENT_ID, json.dumps(event_data))
                
                # Wait for execution to complete (with timeout)
                timeout = 30  # seconds
                start_time = time.time()
                result = None
                
                while time.time() - start_time < timeout:
                    with python_execution_lock:
                        result = python_execution_results.get(execution_id)
                    
                    if result is not None:
                        break
                    
                    time.sleep(0.1)  # Small delay to avoid busy waiting
                
                # Clean up result
                with python_execution_lock:
                    if execution_id in python_execution_results:
                        del python_execution_results[execution_id]
                
                if result is None:
                    # Timeout
                    futil.log(f'Tool call {i+1} execution timed out', adsk.core.LogLevels.ErrorLogLevel)
                    execution_results.append({
                        'tool_name': tool_call.get('name', 'unknown'),
                        'success': False,
                        'message': 'Execution timed out',
                        'python_code': python_code
                    })
                elif result.get('success', False):
                    # Success - include captured result if available
                    captured_result = result.get('result')
                    success_message = tool_output_data.get('message', result.get('message', f'Tool {tool_call.get("name", "unknown")} executed successfully'))
                    
                    # If we have a captured result, use it as the message
                    if captured_result:
                        success_message = captured_result
                    
                    execution_results.append({
                        'tool_name': tool_call.get('name', 'unknown'),
                        'success': True,
                        'message': success_message,
                        'result': captured_result,  # Include raw result
                        'python_code': python_code
                    })
                    futil.log(f'Tool call {i+1} executed successfully: {success_message[:100]}...', adsk.core.LogLevels.InfoLogLevel)
                else:
                    # Error
                    error_msg = result.get('message', 'Unknown error')
                    execution_results.append({
                        'tool_name': tool_call.get('name', 'unknown'),
                        'success': False,
                        'message': error_msg,
                        'python_code': python_code
                    })
                    futil.log(f'Tool call {i+1} execution failed: {error_msg}', adsk.core.LogLevels.ErrorLogLevel)
                
            else:
                # No Python code, just log the tool output
                tool_message = tool_output_data.get('message', 'Tool executed (no code)')
                execution_results.append({
                    'tool_name': tool_call.get('name', 'unknown'),
                    'success': True,
                    'message': tool_message,
                    'python_code': None
                })
                
                futil.log(f'Tool call {i+1} completed (no code): {tool_message}', adsk.core.LogLevels.InfoLogLevel)
                
        except Exception as e:
            import traceback
            error_details = traceback.format_exc()
            futil.log(f'Error executing tool call {i+1}: {error_details}', adsk.core.LogLevels.ErrorLogLevel)
            
            execution_results.append({
                'tool_name': tool_call.get('name', 'unknown'),
                'success': False,
                'message': f'Error: {str(e)}',
                'python_code': None
            })
    
    futil.log(f'Completed executing {len(tool_calls)} tool calls', adsk.core.LogLevels.InfoLogLevel)
    return execution_results


def send_chat_message(message, history=None):
    """Send a message to the utilities tool calling API."""
    try:
        # Get current chat endpoint
        chat_endpoint = get_chat_endpoint()
        
        # Prepare the data to send in the new format
        data = {
            'provider': 'openai',
            'message': message,
            'tool_choice': 'auto',
            'max_tool_calls': 5
        }
        
        # Add history if provided
        if history:
            data['history'] = history
            
        json_data = json.dumps(data).encode('utf-8')

        # Create a request object
        req = urllib.request.Request(chat_endpoint, data=json_data, method='POST')
        req.add_header('Content-Type', 'application/json')
        req.add_header('Accept', 'application/json')
        
        # Add authentication headers if user is authenticated
        auth_headers = auth.get_auth_headers()
        if auth_headers:
            futil.log(f'Adding auth headers to request: {list(auth_headers.keys())}', adsk.core.LogLevels.InfoLogLevel)
            for header_name, header_value in auth_headers.items():
                req.add_header(header_name, header_value)
                # Log token preview (first 20 chars)
                if header_name == 'Authorization':
                    token_preview = header_value[:30] + '...' if len(header_value) > 30 else header_value
                    futil.log(f'Auth token: {token_preview}', adsk.core.LogLevels.InfoLogLevel)
        else:
            futil.log('No auth headers available - user may not be authenticated', adsk.core.LogLevels.WarningLogLevel)

        # Send the request
        with urllib.request.urlopen(req) as response:
            response_data = response.read().decode('utf-8')
            futil.log(f'Chat message sent to utilities API: {response_data}', adsk.core.LogLevels.InfoLogLevel)
            
            # Parse the response JSON
            try:
                parsed_response = json.loads(response_data)
                futil.log(f'Parsed utilities API response: {parsed_response}', adsk.core.LogLevels.InfoLogLevel)
                
                # Handle the new tool calling response format
                if parsed_response.get('success', False):
                    # Extract the main response
                    main_response = parsed_response.get('response', '')
                    
                    # Extract tool calls and outputs
                    tool_calls = parsed_response.get('tool_calls', [])
                    tool_outputs = parsed_response.get('tool_outputs', [])
                    
                    # If there are tool calls, execute them sequentially
                    if tool_calls and tool_outputs:
                        execution_results = execute_tool_calls_sequentially(tool_calls, tool_outputs)
                        return {
                            'response': main_response,
                            'tool_calls': tool_calls,
                            'tool_outputs': tool_outputs,
                            'execution_results': execution_results
                        }
                    else:
                        # No tool calls, just return the response
                        return {
                            'response': main_response,
                            'tool_calls': [],
                            'tool_outputs': [],
                            'execution_results': []
                        }
                else:
                    error_msg = parsed_response.get('error', 'Unknown error')
                    futil.log(f'Utilities API error: {error_msg}', adsk.core.LogLevels.ErrorLogLevel)
                    return {
                        'response': f"Error: {error_msg}",
                        'tool_calls': [],
                        'tool_outputs': [],
                        'execution_results': []
                    }
                    
            except json.JSONDecodeError:
                # If response is not JSON, return as is
                return {
                    'response': response_data,
                    'tool_calls': [],
                    'tool_outputs': [],
                    'execution_results': []
                }
            
    except urllib.error.HTTPError as e:
        error_msg = f"HTTP Error: {e.code} - {e.reason}"
        futil.log(f'HTTP Error sending chat message: {error_msg}', adsk.core.LogLevels.ErrorLogLevel)
        return {
            'response': error_msg,
            'tool_calls': [],
            'tool_outputs': [],
            'execution_results': []
        }
    except urllib.error.URLError as e:
        error_msg = f"URL Error: {e.reason}"
        futil.log(f'URL Error sending chat message: {error_msg}', adsk.core.LogLevels.ErrorLogLevel)
        return {
            'response': error_msg,
            'tool_calls': [],
            'tool_outputs': [],
            'execution_results': []
        }
    except Exception as e:
        error_msg = f"Error sending chat message: {str(e)}"
        futil.log(error_msg, adsk.core.LogLevels.ErrorLogLevel)
        return {
            'response': error_msg,
            'tool_calls': [],
            'tool_outputs': [],
            'execution_results': []
        }


# This event handler is called when the command terminates.
def command_destroy(args: adsk.core.CommandEventArgs):
    # General logging for debug.
    futil.log(f'{CMD_NAME}: Command destroy event.')

    global local_handlers
    local_handlers = []
