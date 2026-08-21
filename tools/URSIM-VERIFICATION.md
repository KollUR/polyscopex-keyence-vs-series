# URSim verification, slices 03 to 05

Three gates are proved in one pass, because they all exercise the same runtime
socket. Work through the sections in order; each one names what to look for.

The teach-time gates for slices 01 and 02 are unchanged by this work.

## 0. Prerequisites

- Docker running, and URSim started with `./run-simulator` from the SDK root.
- The URCap built and installed:

```bash
cd KeyenceData/URCap/vs-series
npm run build          # builds the Docker backend, the frontend, and packages target/vs-series-0.1.0.urcapx
npm run install-urcap
```

- The mock VS Series running on the host, on an address the URSim container and
  the URCap backend container can both reach:

```bash
python3 tools/vs-mock-server.py --host 0.0.0.0 --port 8500
```

Take the host address from the container's point of view (often the Docker
bridge gateway, `ip route | grep default` inside a container) and enter it, with
port 8500, on the VS Series application screen. If the default bridge network
cannot reach the mock, follow the SDK networking / macvlan notes rather than
opening extra host ports by hand.

## 1. The preamble reaches the program

Insert nothing yet. Open the generated script view for an empty program.

**Expect** the VS Series block before Robot Program, containing 26 `def` lines.
The ones the PoC calls are `KeySetCommParam`, `KeyConnect`, `KeyClose`,
`VS_socket_send_command`, `VS_socket_wait_react`, `KeySendCommand_RBCPW` and
`KeyGetCurrentPose`. The globals are initialised above them:

```
global VS_SocketName = "CAM"
global VS_IpAddress = "192.168.0.10"
global VS_CommPort = 8500
global VS_Connected = False
global VS_Command = ""
global VS_React = ""
global VS_LastReply = ""
global VS_ReplyLog = ["", "", "", "", ""]
global VS_ResultPose = p[0, 0, 0, 0, 0, 0]
```

The operator never loads `KeyVsCommonFunctions.script`; if that block is absent,
nothing further in this document will work.

## 2. Slice 03, failure path (no VS Series)

Point the application node at an address with nothing listening, for example
`192.168.0.10:8500` with the mock stopped. Build a program of **VS Connect** then
**VS Disconnect** and play it.

**Expect** the generated script to read:

```
KeySetCommParam("192.168.0.10", 8500)
KeyConnect()
if (not VS_Connected):
  popup("Could not reach the VS Series at 192.168.0.10:8500.", "VS Series", False, True, blocking=True)
  halt
end
KeyClose()
```

**Expect** at runtime: roughly two seconds of retries (10 attempts, 0.2 s apart),
then the error popup, then the program stops. URSim stays responsive. This is the
point of the bounded `KeyConnect`; the sample script's infinite loop would hang
here with no visible cause.

## 3. Slice 03, success path (mock running)

Start the mock, set the application node to its address, and play the same
program.

**Expect** the mock log to show one `connected` line for the runtime socket and a
`disconnected` line when Disconnect runs. No popup.

**Expect** the URCap backend log to show **no** `POST /connect` during the run.
The teach-time socket and the runtime `CAM` socket are separate connections, and
the program must not touch the backend. Reachability polling (`GET /reachability`)
will appear if the application screen or the sidebar is open; that is expected.

## 4. Slice 04, Command node

Program: **VS Connect**, **VS Command** with command `TRG` and *Wait for reply*
on, **VS Disconnect**.

**Expect** the tree label to read `VS Command TRG`, and the label to follow the
field as you edit it. Clearing the command makes the node invalid.

**Expect** the generated script:

```
global VS_Command = "TRG"
VS_socket_send_command(VS_SocketName)
VS_socket_wait_react(VS_SocketName)
global VS_LastReply = VS_React
```

**Expect** the mock log to show `<< 'TRG'\r`, then two reply lines: the
acknowledgement `TRG`, then `1,150.0,-75.0,320.0,0.0,0.0,45.0`.

**Expect** `VS_LastReply` to hold `TRG`. The Command node reads one reply, so it
takes the acknowledgement; the pose line stays in the socket buffer and is what
`KeyIssueTrigger` will consume in slice 06. Read the value from the variables
view, or add a `popup(VS_LastReply, ...)` script line after the Command node.

**Expect** `VS_ReplyLog` to read `["TRG", "", "", "", ""]`. It records every line
`VS_socket_wait_react` returns, newest at index 0, which is not the same thing as
what the mock sent: the pose line is in the mock log but not yet in the reply log,
because no one has read it. That gap is the point of the log.

Turn *Wait for reply* off and regenerate: the last two lines must disappear.

## 4a. Reply framing, both lines in one segment

Restart the mock with `--reply-gap 0` so the acknowledgement and the pose line
share a TCP segment, and replay the slice 04 program.

**Expect** no change in behaviour: `VS_LastReply` still holds exactly `TRG`, with
no trailing carriage return and no pose text appended. `VS_socket_wait_react`
passes the CR to `socket_read_string` as a suffix, so the controller returns one
reply per call and leaves the rest on the socket.

If `VS_LastReply` instead holds both lines glued together, the suffix argument is
not taking effect on this controller — check that the generated script really
reads `suffix="\\r", interpret_escape=True` and that the escape is the two
characters backslash and r, not a literal carriage return in the script text.

Then add a URScript node after the Command node reading `KeyIssueTrigger()`
instead, and confirm `VS_ResultPose` is filled and `VS_ReplyLog` holds both lines,
newest first. This is the case a gap would have hidden.

## 5. Slice 05, Update Position node

Program: **VS Connect**, **VS Update Position** with tool number `0`,
**VS Disconnect**. Jog the robot somewhere non-trivial first, so the pose is not
all zeros.

**Expect** the generated script to be one call, with no pose arithmetic in the
node itself:

```
KeySendCommand_RBCPW(0, KeyGetCurrentPose())
```

**Expect** the mock log to show a CR-terminated line starting `RBCPW,0,` followed
by six pose fields, in **millimetres and degrees**, and the mock to answer
`RBCPW,1`. Cross-check two or three of the fields against the TCP pose shown in
the Move screen: the URScript pose is metres and a rotation vector, so
`KeyGetCurrentPose` must have multiplied the position by 1000 and converted the
rotation to roll-pitch-yaw degrees. If the numbers look like `0.32` rather than
`320.0`, the conversion did not run.

A negative tool number must make the node invalid.

## 6. Where a hang would come from

Both waits in the preamble are bounded, which is a deliberate departure from the
sample script:

- `KeyConnect` gives up after 10 attempts and leaves `VS_Connected` false.
- `VS_socket_wait_react` gives up after 3 seconds and leaves `VS_React` empty.
  The per-call read timeout also paces the loop, so the total is bounded even
  though there is no `sleep`.

If a program stalls anyway, it is not one of these two loops. Check the mock log
first: a command with no matching reply line is the usual cause. `VS_ReplyLog`
narrows it further, because it shows what the program actually consumed: if the
newest entry is a reply to the previous command, the two channels have drifted
out of step and something read a line it did not own.
