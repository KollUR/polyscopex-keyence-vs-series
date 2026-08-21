   ###############################################################################
   # KEYENCE VS Series - runtime helpers
   # Adapted from KeyVsCommonFunctions.script. The operator does not load the
   # sample script; the application node injects this before every program.
   ###############################################################################
   global SocketName = "CAM"
   global IpAddress = "172.17.0.2"
   global CommPort = 8500
   global Connected = False
   global Command = ""
   global React = ""
   global VS_LastReply = ""
   global ResultPose = p[0, 0, 0, 0, 0, 0]
   global Speed = 10
   global WaitTime = 500
   def KeySetCommParam(ip, port):
     # Set communication parameters.
     global SocketName = "CAM"
     global IpAddress = ip
     global CommPort = port
   end
   def KeySetMoveParam(speed, waitTime):
     # Set movement parameters.
     # speed[%], waitTime[ms]
     global Speed = speed
     global WaitTime = waitTime
   end
   def KeyConnect():
     # Open the connection. The sample script retries until socket_open succeeds,
     # which hides the failure and hangs a demo with no VS Series attached, so the
     # attempts are bounded and Connected is left False when they run out.
     global Connected = False
     local attempts = 0
     while (not Connected and attempts < 10):
       global Connected = socket_open(IpAddress, CommPort, SocketName)
       attempts = attempts + 1
       if (not Connected):
         sleep(0.2)
         sync()
       end
     end
     return Connected
   end
   def KeyClose():
     # Close the connection.
     socket_close(SocketName)
   end
   def KeyIssueTrigger():
     # Issue a trigger.
     global Command = "TRG"
     socket_send_command(SocketName)
     socket_wait_react(SocketName)
     local react = str_split(React, ",")
     if react[0] != "TRG":
       return -1
     end
     socket_wait_react(SocketName)
     local result = str_split(React, ",")
     if to_num(result[0]) == 1:
       local posX = to_num(result[1])
       local posY = to_num(result[2])
       local posZ = to_num(result[3])
       local rotX = to_num(result[4])
       local rotY = to_num(result[5])
       local rotZ = to_num(result[6])
       global ResultPose = p[posX, posY, posZ, rotX, rotY, rotZ]
       return 1
     end
     return 0
   end
   def KeySendCommand_RBMR():
     # Send a RBMR command.
     global Command = "RBMR"
     socket_send_command(SocketName)
     socket_wait_react(SocketName)
     local react = str_split(React, ",")
     if react[0] != "RBMR":
       return -1
     end
     global ResultMode = to_num(react[1])
     return 1
   end
   def KeySendCommand_SEI(softEventNo):
     # Send a SEI command.
     global Command = "SEI"
     add_to_command(softEventNo)
     socket_send_command(SocketName)
     socket_wait_react(SocketName)
     local react = str_split(React, ",")
     if react[0] != "SEI":
       return -1
     end
     return 1
   end
   def KeySendCommand_RBRPW(curPose, workNo, toolNo):
     # Send a RBRPW command.
     global Command = "RBRPW"
     add_to_command(curPose[0])
     add_to_command(curPose[1])
     add_to_command(curPose[2])
     add_to_command(curPose[3])
     add_to_command(curPose[4])
     add_to_command(curPose[5])
     add_to_command(workNo)
     add_to_command(toolNo)
     socket_send_command(SocketName)
     socket_wait_react(SocketName)
     local react = str_split(React, ",")
     if react[0] != "RBRPW":
       return -1
     end
     return 1
   end
   def KeySendCommand_RBCP(idx):
     # Send a RBCP command.
     global Command = "RBCP"
     add_to_command(idx)
     socket_send_command(SocketName)
     socket_wait_react(SocketName)
     local react = str_split(React, ",")
     if react[0] != "RBCP":
       return -1
     end
     if to_num(react[1]) == 1:
       local posX = to_num(react[2])
       local posY = to_num(react[3])
       local posZ = to_num(react[4])
       local rotX = to_num(react[5])
       local rotY = to_num(react[6])
       local rotZ = to_num(react[7])
       global ResultPose = p[posX, posY, posZ, rotX, rotY, rotZ]
       return 1
     elif to_num(react[1]) == 2:
       return 2
     end
     return 0
   end
   def KeySendCommand_RBCD(idx):
     # Send a RBCD command.
     global Command = "RBCD"
     add_to_command(idx)
     socket_send_command(SocketName)
     socket_wait_react(SocketName)
     local react = str_split(React, ",")
     if react[0] != "RBCD":
       return -1
     end
     if to_num(react[1]) == 1:
       return 1
     end
     return 0
   end
   def KeySendCommand_RBCE(mode):
     # Send a RBCE command.
     global Command = "RBCE"
     add_to_command(mode)
     socket_send_command(SocketName)
     socket_wait_react(SocketName)
     local react = str_split(React, ",")
     if react[0] != "RBCE":
       return -1
     end
     if to_num(react[1]) == 1:
       return 1
     end
     return 0
   end
   def KeySendCommand_PL(storage, settingNo):
     # Send a PL command.
     global Command = "PL"
     add_to_command(storage)
     add_to_command(settingNo)
     socket_send_command(SocketName)
     socket_wait_react(SocketName)
     local react = str_split(React, ",")
     if react[0] != "PL":
       return -1
     end
     return 1
   end
   def KeySendCommand_CWN(col, row, val):
     # Send a CWN command.
     global Command = "CWN"
     add_to_command(col)
     add_to_command(row)
     add_to_command(val)
     socket_send_command(SocketName)
     socket_wait_react(SocketName)
     local react = str_split(React, ",")
     if react[0] != "CWN":
       return -1
     end
     return 1
   end
   def KeySendCommand_RBCPW(toolNo, curPose):
     # Send a RBCPW command.
     global Command = "RBCPW"
     add_to_command(toolNo)
     add_to_command(curPose[0])
     add_to_command(curPose[1])
     add_to_command(curPose[2])
     add_to_command(curPose[3])
     add_to_command(curPose[4])
     add_to_command(curPose[5])
     socket_send_command(SocketName)
     socket_wait_react(SocketName)
     local react = str_split(React, ",")
     if react[0] != "RBCPW":
       return -1
     end
     return 1
   end
   def KeyGetCurrentPose():
     # Get current pose as RPY.
     local pose = get_actual_tcp_pose()
     local ans = convert_pose_rotvec2rpy(pose)
     return ans
   end
   def KeyMove(targetPose):
     # Move to the specified position.
     local pose = convert_pose_rpy2rotvec(targetPose)
     local speed = Speed / 100
     local accel = speed * speed
     local waitTime = WaitTime / 1000
     movel(pose, accel, speed)
     sleep(waitTime)
   end
   def convert_pose_rpy2rotvec(pose):
     # Conversion (RPY to Rotation Vector)
     local posX = pose[0] / 1000
     local posY = pose[1] / 1000
     local posZ = pose[2] / 1000
     local rpy = [d2r(pose[3]), d2r(pose[4]), d2r(pose[5])]
     local rotVec = rpy2rotvec(rpy)
     local ans = p[posX, posY, posZ, rotVec[0], rotVec[1], rotVec[2]]
     return ans
   end
   def convert_pose_rotvec2rpy(pose):
     # Conversion (Rotation Vector to RPY)
     local posX = pose[0] * 1000
     local posY = pose[1] * 1000
     local posZ = pose[2] * 1000
     local rotVec = [pose[3], pose[4], pose[5]]
     local rpy = rotvec2rpy(rotVec)
     local ans = p[posX, posY, posZ, r2d(rpy[0]), r2d(rpy[1]), r2d(rpy[2])]
     return ans
   end
   def add_to_command(str):
     # Add a string to command.
     global Command = str_cat(Command, ",")
     global Command = str_cat(Command, str)
   end
   def socket_send_cr(socket_name):
     # Send a carriage return.
     socket_send_byte(13, socket_name)
   end
   def socket_send_command(socket_name):
     # Send a command.
     socket_send_string(Command, socket_name)
     socket_send_cr(socket_name)
   end
   def socket_wait_react(socket_name):
     # Wait for a command reaction. The sample script waits forever; this gives up
     # so that a silent VS Series cannot hang the program, and leaves React empty.
     global React = ""
     local waited = 0
     while (length(React) == 0 and waited < 3):
       global React = socket_read_string(socket_name)
       if (length(React) == 0):
         sleep(0.05)
         waited = waited + 0.05
         sync()
       end
     end
     if (length(React) > 0):
       global React = str_sub(React, 0, length(React) - 1)
     end
   end
   def str_split(str, delimiter):
     # Splits a string into a list by a delimiter.
     local first = 0
     local last = str_find(str, delimiter, first)
     local idx = 0
     local arraySize = get_num_char_in_str(str, delimiter)
     local result = generated_getArrayOfSize(arraySize, "")
     if (arraySize == -1):
       result = []
       return result
     end
     while (first < length(str)):
       if (last == -1):
         last = length(str)
       end
       result[idx] = str_sub(str, first, last - first)
       idx = idx + 1
       first = last + 1
       last = str_find(str, delimiter, first)
     end
     return result
   end
   def get_num_char_in_str(str, findstr):
     # Get the number of characters in a string
     local first = 0
     local last = str_find(str, findstr, first)
     local totalNum = 1
     while (True):
       if (last == 0):
         return -1
       elif (last == (length(str) - 1)):
         return -1
       elif (last == -1):
         return totalNum
       else:
         first = last + 1
         totalNum = totalNum + 1
         last = str_find(str, findstr, first)
       end
     end
     return totalNum
   end
   def generated_getArrayOfSize(size, val):
     # Generate array of arg size and initialize with arg val.
     # Min 1 Max 15
     if (size == 1):
       return [val]
     elif (size == 2):
       return [val,val]
     elif (size == 3):
       return [val,val,val]
     elif (size == 4):
       return [val,val,val,val]
     elif (size == 5):
       return [val,val,val,val,val]
     elif (size == 6):
       return [val,val,val,val,val,val]
     elif (size == 7):
       return [val,val,val,val,val,val,val]
     elif (size == 8):
       return [val,val,val,val,val,val,val,val]
     elif (size == 9):
       return [val,val,val,val,val,val,val,val,val]
     elif (size == 10):
       return [val,val,val,val,val,val,val,val,val,val]
     elif (size == 11):
       return [val,val,val,val,val,val,val,val,val,val,val]
     elif (size == 12):
       return [val,val,val,val,val,val,val,val,val,val,val,val]
     elif (size == 13):
       return [val,val,val,val,val,val,val,val,val,val,val,val,val]
     elif (size == 14):
       return [val,val,val,val,val,val,val,val,val,val,val,val,val,val]
     elif (size == 15):
       return [val,val,val,val,val,val,val,val,val,val,val,val,val,val,val]
     end
     return []
   end

   
   $ 6 "keyence-vs-series-vs-connect"
   KeySetCommParam("172.17.0.2", 8500)
   KeyConnect()
   if (not Connected):
     popup("Could not reach the VS Series at 172.17.0.2:8500.", "VS Series", False, True, blocking=True)
     halt
   end
   $ 7 "keyence-vs-series-vs-command"
   global Command = "TRG"
   socket_send_command(SocketName)
   socket_wait_react(SocketName)
   global VS_LastReply = React
   $ 8 "keyence-vs-series-vs-disconnect"
   KeyClose()
   $ 9 "ur-script"
   popup(VS_LastReply)
end
