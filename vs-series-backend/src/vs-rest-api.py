"""Teach-time TCP channel for the KEYENCE VS Series URCap.

The PolyScope X frontend runs in a browser and cannot open a raw TCP socket, so
every teach-time check goes through this container. The runtime channel is a
different thing entirely: that socket is opened by URScript on the controller
under the name CAM and never appears here.
"""

import socket
import threading

import flask
from flask import Flask, jsonify, request
from flask_cors import CORS

CONNECT_TIMEOUT_S = 1.0

app = Flask(__name__)
CORS(app)

# The calibration socket is held open between /connect and /disconnect. A lock
# guards it because reachability polling and calibration share this process.
_teach_time_socket = None
_teach_time_lock = threading.Lock()


def _read_target():
    """Read host and port from the query string or the JSON body."""
    host = request.args.get("host")
    port = request.args.get("port")

    if host is None or port is None:
        body = request.get_json(silent=True) or {}
        host = host or body.get("host")
        port = port or body.get("port")

    if not host:
        raise ValueError("host is required")

    try:
        port = int(port)
    except (TypeError, ValueError):
        raise ValueError("port must be an integer")

    if not 0 < port <= 65535:
        raise ValueError("port must be between 1 and 65535")

    return host, port


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"ok": True})


@app.route("/reachability", methods=["GET"])
def reachability():
    """Open a TCP connection to the stored address, then close it again.

    No application payload is sent, so this cannot disturb a VS Series that is
    mid-inspection. Reachable is not the same as program-connected.
    """
    try:
        host, port = _read_target()
    except ValueError as error:
        return jsonify({"reachable": False, "error": str(error)}), 400

    probe = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    probe.settimeout(CONNECT_TIMEOUT_S)
    try:
        probe.connect((host, port))
        return jsonify({"reachable": True, "error": None})
    except OSError as error:
        return jsonify({"reachable": False, "error": str(error)})
    finally:
        probe.close()


@app.route("/connect", methods=["POST"])
def connect():
    """Open and hold the calibration socket."""
    global _teach_time_socket

    try:
        host, port = _read_target()
    except ValueError as error:
        return jsonify({"connected": False, "error": str(error)}), 400

    with _teach_time_lock:
        _close_locked()

        opened = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        opened.settimeout(CONNECT_TIMEOUT_S)
        try:
            opened.connect((host, port))
        except OSError as error:
            opened.close()
            return jsonify({"connected": False, "error": str(error)})

        _teach_time_socket = opened
        return jsonify({"connected": True, "error": None})


@app.route("/disconnect", methods=["POST"])
def disconnect():
    with _teach_time_lock:
        _close_locked()
    return jsonify({"connected": False, "error": None})


def _close_locked():
    """Close the calibration socket. Caller must hold the lock."""
    global _teach_time_socket

    if _teach_time_socket is None:
        return

    try:
        _teach_time_socket.shutdown(socket.SHUT_RDWR)
    except OSError:
        pass
    finally:
        _teach_time_socket.close()
        _teach_time_socket = None
