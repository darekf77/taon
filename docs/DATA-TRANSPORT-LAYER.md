## Taon's Communication Protocol Layers 

Taon provides universal seamless transport layer for
NodeJS/Electron workers/proceses/apps and Angular based websites.

You as developer - you don't have to do anything to make sure 
your app is working in different environment/artifact 

**Taon Framework/CLI** will intelligently/automatically choose transport
abstraction layer based on what you need. 

Communication layers/protocols handled by **Taon**:

###  Standard TCP (local or remote server)
NodeJS (local or remote) Server or app => Angular Website <br>
(REST,WS,TCP already included - UDP in future)

###  Websql MODE 
Server like app in browser => Angular Website<br>
*(browser JavaScript - broadcast api in future)*

###  Electron app
Electron backend => Angular Website in Electron<br>
*(Electron IPC already included)*

###  Backend Nodejs Workers
NodeJS Server or app => NodeJS Server or app<br>
*(REST,TCP already included - WS, IPC in future)*
