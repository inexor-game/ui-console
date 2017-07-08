import tree from '../../../src/tree';
import $ from 'jquery';
import jqConsole from 'jq-console';
import util from 'util';

export default class InexorHud {

  constructor() {

    this.root = new tree.Root();
    this.treeWebsocket = new WebSocket("ws://localhost:31416/api/v1/ws/tree");
    // TODO: handle updates on the console configuration (size, colors, ...)
    // this.treeWebsocket.onmessage = this.onTreeMessage.bind(this);

    this.consoleWebsocket = new WebSocket("ws://localhost:31416/api/v1/ws/console");
    this.consoleWebsocket.onmessage = this.onConsoleWsMessage.bind(this);
    this.consoleWebsocket.onopen = this.onConsoleWsOpen.bind(this);
    this.consoleWebsocket.onerror = this.onConsoleWsError.bind(this);

    // Contains the console instances
    this.consoleInstances = {};

    // The instance id
    this.instanceId = this.getInstanceId();
    console.log('Instance ID: ' + this.instanceId);
  }

  createConsole(instanceId) {

    // Add dom node
    $('body').append(util.format('<div id="console-%s" class="console"></div>', instanceId));

    // The console widget
    this.consoleInstances[instanceId] = $('#console-' + instanceId).jqconsole(util.format('Inexor Web Console %s\n\n', instanceId), '>>> ');

    // Request the console buffer
    this.sendInit(instanceId);

    // Start the prompt
    this.prompt(instanceId);

  }

  onConsoleWsMessage(event) {
    // TODO: remove next line
    // console.log('Received message: ' + event.data);
    try {
      let request = JSON.parse(event.data);
      switch (request.type) {
        case 'log':
          this.log(request);
          break;
        case 'chat':
          this.chat(request);
          break;
        default:
          break;
      }
    } catch (err) {
      console.log(err);
    }
  }

  onConsoleWsOpen() {
    this.createConsole(this.instanceId);
  }

  onConsoleWsError(error) {
    console.log('Websocket error: ' + error);
  }

  log(request) {
    this.write(request.instanceId, util.format('[%s] %s', request.level, request.message), util.format('log-%s', request.level));
  }

  chat(request) {
    this.write(request.instanceId, util.format('%s: %s', request.fromName, request.message), util.format('chat-%s', request.chatTarget));
  }

  prompt(instanceId) {
    this.consoleInstances[instanceId].Prompt(true, (input) => {
      // TODO: remove next line
      this.write(instanceId, input, 'jqconsole-input');
      try {
        this.send(instanceId, input);
      } catch (err) {
        console.log(err);
      }
      this.prompt(instanceId);
    });
    
  }

  write(instanceId, message, style = 'console') {
    this.consoleInstances[instanceId].Write(message + '\n', util.format('jqconsole-%s', style));
  }

  send(instanceId, input) {
    let message = JSON.stringify({
      'state': 'input',
      'instanceId': instanceId,
      'input': input
    });
    // TODO: remove next line
    console.log('Sending message: ' + message);
    this.consoleWebsocket.send(message);
  }

  sendInit(instanceId) {
    let message = JSON.stringify({
      'state': 'init',
      'instanceId': instanceId
    });
    // TODO: remove next line
    console.log('Sending message: ' + message);
    this.consoleWebsocket.send(message);
  }

  onTreeMessage(event) {
    let request = JSON.parse(event.data);
    let node;
    switch (request.state) {
      case 'add':
        try {
          node = this.root.createRecursive(request.path, request.datatype, request.value, true);
        } catch(err) {
          console.log(err);
        }
        break;
      case 'sync':
        node = this.root.findNode(request.path);
        if (node != null) {
          try {
            node.set(request.value);
          } catch(err) {
            console.log(err);
          }
        } else {
          try {
            node = this.root.createRecursive(request.path, request.datatype, request.value, true);
          } catch(err) {
            console.log(err);
          }
        }
        break;
      default:
        break;
    }
  }

  /**
   * Extracts the instance id from the URL.
   * @function
   * @name getInstanceId
   * @returns {string} The instance id.
   */
  getInstanceId() {
    let query = window.location.search.split('?');
    if (query.length == 2) {
      let params = query[1].split('&');
      for (var i = 0; i < params.length; i++) {
        if (params[i].split('=')[0] == 'instanceId') {
          return params[i].split('=')[1];
        }
      }
    }
    return '';
  }

}
