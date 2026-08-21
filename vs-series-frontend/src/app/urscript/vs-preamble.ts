import {
    VS_CONNECT_RETRY_COUNT,
    VS_CONNECT_RETRY_DELAY_S,
    VS_REPLY_LOG_SIZE,
    VS_SOCKET_NAME,
    VS_SOCKET_READ_POLL_S,
    VS_SOCKET_READ_TIMEOUT_S
} from '../vs-series.constants';

/**
 * URScript lists are fixed-size, so VS_ReplyLog is rebuilt on each write rather
 * than shifted in place. Both expressions are generated so that the list length
 * follows VS_REPLY_LOG_SIZE.
 */
const replyLogEmpty = Array.from({ length: VS_REPLY_LOG_SIZE }, () => '""').join(', ');
const replyLogWithNewest = [
    'reply',
    ...Array.from({ length: VS_REPLY_LOG_SIZE - 1 }, (_, index) => `VS_ReplyLog[${index}]`)
].join(', ');

/**
 * Runtime URScript for the KEYENCE VS Series, adapted from
 * KeyVsCommonFunctions.script and injected by the application node's
 * generatePreamble. Program nodes emit calls into this, never function bodies.
 *
 * Four deliberate departures from the sample script:
 *   - KeyConnect retries a bounded number of times instead of looping forever.
 *   - VS_socket_wait_react gives up after a timeout and leaves VS_React empty.
 *   - VS_socket_wait_react frames replies on the CR instead of taking whatever
 *     has arrived, so two replies in one TCP segment stay two replies.
 *   - The globals are initialised here, so reading VS_LastReply before the first
 *     Command node is not an undefined-variable error.
 *
 * Functions the PoC does not call yet (KeyIssueTrigger, KeyMove, PL, SEI, CWN,
 * RBMR, RBRPW, RBCP, RBCD, RBCE) stay here so that later work adds callers
 * rather than rewriting the preamble.
 */
export const buildVsPreamble = (ipAddress: string, port: number): string => `
###############################################################################
# KEYENCE VS Series - runtime helpers
# Adapted from KeyVsCommonFunctions.script. The operator does not load the
# sample script; the application node injects this before every program.
###############################################################################

global VS_SocketName = "${VS_SOCKET_NAME}"
global VS_IpAddress = "${ipAddress}"
global VS_CommPort = ${port}
global VS_Connected = False
global VS_Command = ""
global VS_React = ""
global VS_LastReply = ""
global VS_ReplyLog = [${replyLogEmpty}]
global VS_ResultPose = p[0, 0, 0, 0, 0, 0]
global VS_Speed = 10
global VS_WaitTime = 500

def KeySetCommParam(ip, port):
  # Set communication parameters.
  global VS_SocketName = "${VS_SOCKET_NAME}"
  global VS_IpAddress = ip
  global VS_CommPort = port
end

def KeySetMoveParam(speed, waitTime):
  # Set movement parameters.
  # speed[%], waitTime[ms]
  global VS_Speed = speed
  global VS_WaitTime = waitTime
end

def KeyConnect():
  # Open the connection. The sample script retries until socket_open succeeds,
  # which hides the failure and hangs a demo with no VS Series attached, so the
  # attempts are bounded and VS_Connected is left False when they run out.
  global VS_Connected = False
  local attempts = 0
  while (not VS_Connected and attempts < ${VS_CONNECT_RETRY_COUNT}):
    global VS_Connected = socket_open(VS_IpAddress, VS_CommPort, VS_SocketName)
    attempts = attempts + 1
    if (not VS_Connected):
      sleep(${VS_CONNECT_RETRY_DELAY_S})
      sync()
    end
  end
  return VS_Connected
end

def KeyClose():
  # Close the connection.
  socket_close(VS_SocketName)
end

def KeyIssueTrigger():
  # Issue a trigger.
  global VS_Command = "TRG"
  VS_socket_send_command(VS_SocketName)
  VS_socket_wait_react(VS_SocketName)
  local react = VS_str_split(VS_React, ",")
  if react[0] != "TRG":
    return -1
  end
  VS_socket_wait_react(VS_SocketName)
  local result = VS_str_split(VS_React, ",")
  if to_num(result[0]) == 1:
    local posX = to_num(result[1])
    local posY = to_num(result[2])
    local posZ = to_num(result[3])
    local rotX = to_num(result[4])
    local rotY = to_num(result[5])
    local rotZ = to_num(result[6])
    global VS_ResultPose = p[posX, posY, posZ, rotX, rotY, rotZ]
    return 1
  end
  return 0
end

def KeySendCommand_RBMR():
  # Send a RBMR command.
  global VS_Command = "RBMR"
  VS_socket_send_command(VS_SocketName)
  VS_socket_wait_react(VS_SocketName)
  local react = VS_str_split(VS_React, ",")
  if react[0] != "RBMR":
    return -1
  end
  global VS_ResultMode = to_num(react[1])
  return 1
end

def KeySendCommand_SEI(softEventNo):
  # Send a SEI command.
  global VS_Command = "SEI"
  VS_add_to_command(softEventNo)
  VS_socket_send_command(VS_SocketName)
  VS_socket_wait_react(VS_SocketName)
  local react = VS_str_split(VS_React, ",")
  if react[0] != "SEI":
    return -1
  end
  return 1
end

def KeySendCommand_RBRPW(curPose, workNo, toolNo):
  # Send a RBRPW command.
  global VS_Command = "RBRPW"
  VS_add_to_command(curPose[0])
  VS_add_to_command(curPose[1])
  VS_add_to_command(curPose[2])
  VS_add_to_command(curPose[3])
  VS_add_to_command(curPose[4])
  VS_add_to_command(curPose[5])
  VS_add_to_command(workNo)
  VS_add_to_command(toolNo)
  VS_socket_send_command(VS_SocketName)
  VS_socket_wait_react(VS_SocketName)
  local react = VS_str_split(VS_React, ",")
  if react[0] != "RBRPW":
    return -1
  end
  return 1
end

def KeySendCommand_RBCP(idx):
  # Send a RBCP command.
  global VS_Command = "RBCP"
  VS_add_to_command(idx)
  VS_socket_send_command(VS_SocketName)
  VS_socket_wait_react(VS_SocketName)
  local react = VS_str_split(VS_React, ",")
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
    global VS_ResultPose = p[posX, posY, posZ, rotX, rotY, rotZ]
    return 1
  elif to_num(react[1]) == 2:
    return 2
  end
  return 0
end

def KeySendCommand_RBCD(idx):
  # Send a RBCD command.
  global VS_Command = "RBCD"
  VS_add_to_command(idx)
  VS_socket_send_command(VS_SocketName)
  VS_socket_wait_react(VS_SocketName)
  local react = VS_str_split(VS_React, ",")
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
  global VS_Command = "RBCE"
  VS_add_to_command(mode)
  VS_socket_send_command(VS_SocketName)
  VS_socket_wait_react(VS_SocketName)
  local react = VS_str_split(VS_React, ",")
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
  global VS_Command = "PL"
  VS_add_to_command(storage)
  VS_add_to_command(settingNo)
  VS_socket_send_command(VS_SocketName)
  VS_socket_wait_react(VS_SocketName)
  local react = VS_str_split(VS_React, ",")
  if react[0] != "PL":
    return -1
  end
  return 1
end

def KeySendCommand_CWN(col, row, val):
  # Send a CWN command.
  global VS_Command = "CWN"
  VS_add_to_command(col)
  VS_add_to_command(row)
  VS_add_to_command(val)
  VS_socket_send_command(VS_SocketName)
  VS_socket_wait_react(VS_SocketName)
  local react = VS_str_split(VS_React, ",")
  if react[0] != "CWN":
    return -1
  end
  return 1
end

def KeySendCommand_RBCPW(toolNo, curPose):
  # Send a RBCPW command.
  global VS_Command = "RBCPW"
  VS_add_to_command(toolNo)
  VS_add_to_command(curPose[0])
  VS_add_to_command(curPose[1])
  VS_add_to_command(curPose[2])
  VS_add_to_command(curPose[3])
  VS_add_to_command(curPose[4])
  VS_add_to_command(curPose[5])
  VS_socket_send_command(VS_SocketName)
  VS_socket_wait_react(VS_SocketName)
  local react = VS_str_split(VS_React, ",")
  if react[0] != "RBCPW":
    return -1
  end
  return 1
end

def KeyGetCurrentPose():
  # Get current pose as RPY.
  local pose = get_actual_tcp_pose()
  local ans = VS_convert_pose_rotvec2rpy(pose)
  return ans
end

def KeyMove(targetPose):
  # Move to the specified position.
  local pose = VS_convert_pose_rpy2rotvec(targetPose)
  local speed = VS_Speed / 100
  local accel = speed * speed
  local waitTime = VS_WaitTime / 1000
  movel(pose, accel, speed)
  sleep(waitTime)
end

def VS_convert_pose_rpy2rotvec(pose):
  # Conversion (RPY to Rotation Vector)
  local posX = pose[0] / 1000
  local posY = pose[1] / 1000
  local posZ = pose[2] / 1000
  local rpy = [d2r(pose[3]), d2r(pose[4]), d2r(pose[5])]
  local rotVec = rpy2rotvec(rpy)
  local ans = p[posX, posY, posZ, rotVec[0], rotVec[1], rotVec[2]]
  return ans
end

def VS_convert_pose_rotvec2rpy(pose):
  # Conversion (Rotation Vector to RPY)
  local posX = pose[0] * 1000
  local posY = pose[1] * 1000
  local posZ = pose[2] * 1000
  local rotVec = [pose[3], pose[4], pose[5]]
  local rpy = rotvec2rpy(rotVec)
  local ans = p[posX, posY, posZ, r2d(rpy[0]), r2d(rpy[1]), r2d(rpy[2])]
  return ans
end

def VS_add_to_command(str):
  # Add a string to command.
  global VS_Command = str_cat(VS_Command, ",")
  global VS_Command = str_cat(VS_Command, str)
end

def VS_socket_send_cr(socket_name):
  # Send a carriage return.
  socket_send_byte(13, socket_name)
end

def VS_socket_send_command(socket_name):
  # Send a command.
  socket_send_string(VS_Command, socket_name)
  VS_socket_send_cr(socket_name)
end

def VS_socket_wait_react(socket_name):
  # Wait for one CR-terminated reply. The sample script waits forever; this gives
  # up so that a silent VS Series cannot hang the program, and leaves VS_React
  # empty. The read timeout doubles as the poll delay, so there is no sleep.
  #
  # The CR goes in as a suffix so the controller frames the reply: one line per
  # call, terminator removed, the rest left on the socket. A plain
  # socket_read_string returns whatever has arrived, which glues both lines of a
  # TRG answer together when they share a TCP segment.
  global VS_React = ""
  local waited = 0
  while (length(VS_React) == 0 and waited < ${VS_SOCKET_READ_TIMEOUT_S}):
    global VS_React = socket_read_string(socket_name, suffix="\\r", interpret_escape=True, timeout=${VS_SOCKET_READ_POLL_S})
    if (length(VS_React) == 0):
      waited = waited + ${VS_SOCKET_READ_POLL_S}
      sync()
    end
  end
  VS_record_reply(VS_React)
end

def VS_record_reply(reply):
  # Keep the last ${VS_REPLY_LOG_SIZE} replies for diagnostics, newest at index 0.
  # Recording here rather than in the Command node captures every read, including
  # both of KeyIssueTrigger's, so the log shows what the program consumed rather
  # than what the VS Series sent. Timeouts are skipped, so an empty slot always
  # means nothing was ever stored there.
  if (length(reply) > 0):
    global VS_ReplyLog = [${replyLogWithNewest}]
  end
end

def VS_str_split(str, delimiter):
  # Splits a string into a list by a delimiter.
  local first = 0
  local last = str_find(str, delimiter, first)
  local idx = 0
  local arraySize = VS_get_num_char_in_str(str, delimiter)
  local result = VS_generated_getArrayOfSize(arraySize, "")
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

def VS_get_num_char_in_str(str, findstr):
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

def VS_generated_getArrayOfSize(size, val):
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
###############################################################################
# End of KEYENCE VS Series - runtime helpers
###############################################################################
`;
