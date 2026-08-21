# Mock VS Series server

`vs-mock-server.py` stands in for a KEYENCE VS Series so the URCap can be
exercised against URSim without hardware. It speaks the CR-terminated ASCII
protocol from `KeyVsCommonFunctions.script`: read a line, reply with a line.

Only the Python standard library is needed. For the slice-by-slice acceptance
walkthrough, see [URSIM-VERIFICATION.md](URSIM-VERIFICATION.md); this file
covers the mock itself.

## Running it

```bash
cd KeyenceData/URCap/vs-series
python3 tools/vs-mock-server.py --host 0.0.0.0 --port 8500
```

Stop it with Ctrl-C.

| Flag | Default | Meaning |
| --- | --- | --- |
| `--host` | `0.0.0.0` | Bind address. Keep the default so other containers can reach it. |
| `--port` | `8500` | Bind port. Matches the `CommPort` default in the preamble. |
| `--trg-result` | `ok` | `ng` makes `TRG` answer with a search failure instead of a pose. |
| `--reply-gap` | `0.15` | Seconds between consecutive reply lines. |

`--reply-gap` paces the two lines of a `TRG` answer, modelling a device that
replies in its own time. Setting it to `0` sends both in one TCP segment, which
is the harder case and worth testing: the preamble has to frame replies on the
CR, and a program that only works with a gap is relying on timing the real
device does not guarantee.

## Which address to enter in the URCap

Not `127.0.0.1`. The mock, URSim and the URCap backend are in different
containers, so the address must be the mock's address *as seen from URSim*. With
both on the default Docker bridge, that is the mock host's bridge IP:

```bash
docker inspect -f '{{.Name}} {{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' \
  $(docker ps -q)
```

Enter that address and port 8500 on the VS Series application screen. If the
default bridge cannot reach the mock, follow the SDK networking / macvlan notes
rather than opening extra host ports by hand.

## Reading the log

Every line is tagged with the peer address, so the two channels the URCap opens
can be told apart. `<<` is a command received, `>>` a reply sent.

```
[172.17.0.3:50920] connected
[172.17.0.3:50920] << 'TRG'\r
[172.17.0.3:50920] >> 'TRG'\r
[172.17.0.3:50920] >> '1,150.0,-75.0,320.0,0.0,0.0,45.0'\r
[172.17.0.3:50920] disconnected
```

A connect immediately followed by a disconnect with no payload in between is the
teach-time reachability probe from the backend, driven by the application screen
or the sidebar. A connection that carries commands is the runtime `CAM` socket
opened by URScript. A command with no matching reply line is the usual cause of
a stalled program.

## Replies

`TRG` answers on two lines, as the real device does: an acknowledgement, then
the search result. The Command node reads only the first; the second is what
`KeyIssueTrigger` consumes.

| Command | Reply |
| --- | --- |
| `TRG` | `TRG`, then `1,150.0,-75.0,320.0,0.0,0.0,45.0` (or `0` with `--trg-result ng`) |
| `RBCP` | `RBCP,1,150.0,-75.0,320.0,0.0,0.0,45.0` |
| `RBMR` | `RBMR,1` |
| anything else | the verb echoed with a success flag, e.g. `RBCPW,1` |

The catch-all is enough for `RBCPW`, `SEI`, `PL`, `CWN`, `RBRPW`, `RBCD` and
`RBCE`, because the script only checks that a reply starts with the verb it
sent. The pose is a fixed dummy in VS Series units, millimetres and degrees.

## Checking it by hand

Useful for confirming the mock works before blaming the URCap:

```bash
python3 - <<'PY'
import socket, time
s = socket.create_connection(("127.0.0.1", 8500), timeout=3)
s.sendall(b"TRG\r")
time.sleep(0.5)
print(repr(s.recv(1024)))
s.close()
PY
```

Expect `b'TRG\r1,150.0,-75.0,320.0,0.0,0.0,45.0\r'`.
