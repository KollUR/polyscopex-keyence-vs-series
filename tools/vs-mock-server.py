#!/usr/bin/env python3
"""Mock KEYENCE VS Series for URSim verification without hardware.

Speaks the CR-terminated ASCII protocol from KeyVsCommonFunctions.script: read a
line, reply with a line. Both channels of the URCap connect here, and each is
logged with its peer address so a teach-time reachability probe (connect, then
close with no payload) is easy to tell apart from the runtime CAM socket.

    python3 tools/vs-mock-server.py --host 0.0.0.0 --port 8500

TRG answers on two lines, as the real device does: an acknowledgement, then the
search result. The Command node reads only the first; the second is what
KeyIssueTrigger consumes. --reply-gap paces the two lines to model a device that
answers in its own time; --reply-gap 0 puts them in one TCP segment, which is the
case worth testing, because the URCap has to frame on the CR rather than trust
one read to hold one line.
"""

import argparse
import socketserver
import threading
import time

CR = b"\r"

# Dummy search result in VS Series units: mm and degrees.
TRG_POSE = "150.0,-75.0,320.0,0.0,0.0,45.0"


class VsHandler(socketserver.StreamRequestHandler):
    def handle(self):
        peer = f"{self.client_address[0]}:{self.client_address[1]}"
        print(f"[{peer}] connected", flush=True)

        buffer = bytearray()
        while True:
            chunk = self.request.recv(1024)
            if not chunk:
                break

            buffer.extend(chunk)
            while CR in buffer:
                line, _, rest = bytes(buffer).partition(CR)
                buffer = bytearray(rest)
                self.respond(peer, line.decode("ascii", errors="replace"))

        if buffer:
            print(f"[{peer}] discarded partial line {bytes(buffer)!r}", flush=True)
        print(f"[{peer}] disconnected", flush=True)

    def respond(self, peer, command):
        print(f"[{peer}] << {command!r}\\r", flush=True)

        verb = command.split(",")[0].strip().upper()
        replies = self.replies_for(verb)

        for index, reply in enumerate(replies):
            if index > 0:
                time.sleep(self.server.reply_gap)
            print(f"[{peer}] >> {reply!r}\\r", flush=True)
            self.request.sendall(reply.encode("ascii") + CR)

    def replies_for(self, verb):
        if verb == "TRG":
            result = "0" if self.server.trg_result == "ng" else f"1,{TRG_POSE}"
            return ["TRG", result]
        if verb == "RBCP":
            return [f"RBCP,1,{TRG_POSE}"]
        if verb == "RBMR":
            return ["RBMR,1"]
        if verb == "":
            return [""]
        # Every other command in the script checks only that the reply starts
        # with the verb it sent, so echoing the verb with a success flag is
        # enough for RBCPW, SEI, PL, CWN, RBRPW, RBCD and RBCE.
        return [f"{verb},1"]


class VsServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True

    def __init__(self, address, handler, trg_result, reply_gap):
        super().__init__(address, handler)
        self.trg_result = trg_result
        self.reply_gap = reply_gap


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--host", default="0.0.0.0", help="bind address (default: all interfaces)")
    parser.add_argument("--port", type=int, default=8500, help="bind port (default: 8500)")
    parser.add_argument(
        "--trg-result",
        choices=["ok", "ng"],
        default="ok",
        help="answer TRG with a pose (ok) or a search failure (ng)",
    )
    parser.add_argument(
        "--reply-gap",
        type=float,
        default=0.15,
        help="seconds between consecutive reply lines (default: 0.15)",
    )
    args = parser.parse_args()

    server = VsServer((args.host, args.port), VsHandler, args.trg_result, args.reply_gap)
    print(f"Mock VS Series listening on {args.host}:{args.port} (TRG result: {args.trg_result})", flush=True)

    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        thread.join()
    except KeyboardInterrupt:
        print("\nStopping", flush=True)
        server.shutdown()


if __name__ == "__main__":
    main()
