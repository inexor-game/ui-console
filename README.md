# Inexor Web Console

## Console Input Handling

1. [UI-Console] User enters a command
2. [UI-Console] Sends REST Request: POST /instances/:instance_id/execute { command: command }
3. [Flex] Receives REST Request: /instances/:instance_id/execute
4. [Flex] Calls CommandManager.executeCommand(instance_id, command) --> redirects output to ConsoleManager.writeBuffer(buffer)
5. [Flex] Executes yargs.commandDir('server/commands/cli/')
6. [TreeClient] Sends REST Request for command /api/v1/...
7. [Flex (2)] Receives REST Request /api/v1/... 
8. [Flex (2)] Executes Business Logic
9. [Flex (2)] Sends REST Response
10. [TreeClient] Receives REST Response
11. [Flex] output = CommandManager.executeCommand()
12. [Flex] ConsoleManager.writeBuffer(output)
13. [Flex] Sends REST Response
14. [UI-Console] Receives REST Response
15. [UI-Console] Updates the console output

## Architecture

* Inexor Core displays the Inexor Web Console as transparent layer (it's possible to use the Inexor Web Console with a normal web browser as well)
* Inexor Flex delivers the user interface
* Inexor Flex manages the console buffer
* Inexor Flex manages execution of commands
