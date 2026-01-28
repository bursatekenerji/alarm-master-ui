# GitHub Pages - EMQX Remote UI (WSS)

## EMQX Cloud
- Host: fa1714ff.ala.eu-central-1.emqxsl.com
- WebSocket over TLS/SSL: 8084
- URL: wss://<host>:8084/mqtt

## Topic
Prefix = tek/
- Status: tek/status
- Cmd: tek/cmd

Komut payload örnekleri:
{"cmd":"ack"}
{"cmd":"mute"}
{"cmd":"reset"}
{"cmd":"maint_on"}
{"cmd":"maint_off"}
