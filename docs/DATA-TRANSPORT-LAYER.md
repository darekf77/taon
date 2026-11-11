## Taon's Communication Protocol Layers 

Taon provides universal seamless transport layer for
NodeJS/Electron workers/proceses/apps and Angular based websites.

You as developer - you don't have to do anything to make sure 
your app is working in different environment/artifact 

**Taon Framework/CLI** will intelligently/automatically choose transport
abstraction layer based on what you need. 

Communication layers/protocols handled by **Taon**:

###  Standard TCP/WS 
**Standard NodeJS Server App** <=> **Angular Website** <br>
TCP/WS(TCP Upgrade protocol) already included, UDP in future

###  Standard TCP 
**Clouflare Worker App** <=> **Angular Website** <br>
TCP only - no realtime communicaiton

###  Websql MODE 
**Server App Inside Browser** <=> **Angular Website**<br>
Cross browser tabs communication with - broadcast api in future

###  Electron app
**Electron Backend App** <=> **Angular Website in Electron**<br>
Electron IPC already included

---

### Also There is a support for backend/backend communication

(Backend/Backend) Nodejs Servers / Cloudfalre Workers
NodeJS Server App <=> NodeJS Server Appp<br>

