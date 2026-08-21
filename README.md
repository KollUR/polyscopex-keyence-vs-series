# KEYENCE VS Series — PolyScope X URCap

Proof of concept that connects PolyScope X to a KEYENCE VS Series vision sensor over
CR-terminated ASCII TCP. Scope, vocabulary and the slice order live in
`../../VS/agent-schema/`.

Implemented so far: slices 00 (scaffold), 01 (application settings) and 02 (teach-time
reachability). Slices 03 to 06 add the URScript preamble, runtime Connect/Disconnect,
the Command node, Update Position and the Trigger and Move `.urmodule`.

## Contributions

| Contribution | Type string | Role |
| --- | --- | --- |
| Application | `keyence-vs-series-vs-application` | Persists IP address and port; Test; calibration Connect/Disconnect |
| Sidebar | `keyence-vs-series-vs-sidebar` | Shows Reachable or Unreachable while open |
| Program node | `keyence-vs-series-vs-connect` | Runtime connect (shell) |
| Program node | `keyence-vs-series-vs-disconnect` | Runtime disconnect (shell) |
| Program node | `keyence-vs-series-vs-command` | Send one command (shell) |
| Program node | `keyence-vs-series-vs-update-position` | Register capture position (shell) |
| Container | `vs-series-backend` | Flask; owns the teach-time TCP channel |

## Two channels, never conflated

The frontend runs in a browser and cannot open a raw TCP socket, so every teach-time
check goes through the container over its `rest-api` ingress. The runtime channel is
separate: URScript on the controller opens a socket named `CAM`. **Reachable therefore
does not mean the running program holds `CAM` open**, and the sidebar deliberately never
claims otherwise.

Backend endpoints: `GET /health`, `GET /reachability?host=&port=`, `POST /connect`,
`POST /disconnect`.

## Build and install

This repository is not self-contained. The build reaches out to
`../../../manifest-spec-19.11.22.json`, so the clone has to sit at
`KeyenceData/URCap/vs-series` inside a PolyScope X SDK checkout before any of the
commands below will work.

```shell
npm install
npm run build
npm run install-urcap -- --port 45000     # URSim publishing its web port on 45000
npm run install-urcap -- --host <robot_ip> # a real robot
```

Refresh the browser after installing. A newly installed sidebar has to be activated once
under Application then Sidebar.

### Dependency versions

The generator template pins `@universal-robots` packages that the package feed does not
publish (`contribution-api` 22.14.184, `ui-angular-components` and `designtokens`
22.14.194). This project pins the newest versions the feed actually serves:
`contribution-api` 22.14.140 and `ui-angular-components` / `designtokens` 22.14.151.
Revisit these pins when the feed catches up with the template.

### Manifest spec path

`install-urcap` and `validate-manifest` reference `manifest-spec-19.11.22.json` at the
SDK root. Because this project sits three levels below that root, `package.json` uses
`../../../manifest-spec-19.11.22.json` rather than the generator's `../`.

## Testing without a VS Series

Point the application node at any TCP listener the backend container can reach. Inside
URSim the container sits on `ur-cobot-network`, whose gateway is the URSim container
itself, so a listener started there is reachable at `172.19.0.1`:

```shell
docker exec -d ursim-polyscopex-runtime-1 sh -c "nc -lk -p 8500 -e /bin/cat"
```

That echoes whatever it receives, which also stands in for the CR-terminated reply the
later slices need. Confirm the container's own view of the check with:

```shell
docker exec ursim-polyscopex-runtime-1 docker exec keyence_vs-series_vs-series-backend \
  wget -q -O - 'http://127.0.0.1:5000/reachability?host=172.19.0.1&port=8500'
```
