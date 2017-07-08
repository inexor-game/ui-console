import tree from '../../../src/tree';
import $ from 'jquery';
import jqConsole from 'jq-console';
import util from 'util';

export default class InexorConsole {

  constructor() {

    /**
     * Get the URL parameters.
     * 
     * instanceId: The id of the Inexor Core instance.
     * host: The hostname of the Inexor Flex instance.
     * port: The port of the Inexor Flex instance.
     */
    this.parameters = this.getUrlParameters();

    /**
     * Create an empty tree.
     */
    this.root = new tree.Root();

    /**
     * Open websocket for the Inexor Tree.
     */
    this.treeWebsocket = new WebSocket(util.format('ws://%s:%s/api/v1/ws/tree', this.parameters.host, this.parameters.port));
    // TODO: handle updates on the console configuration (size, colors, ...)
    this.treeWebsocket.onmessage = this.onTreeMessage.bind(this);
    this.treeWebsocket.onopen = this.onTreeOpen.bind(this);
    this.treeWebsocket.onerror = this.onTreeError.bind(this);

    /**
     * Open websocket for the console.
     */
    this.consoleWebsocket = new WebSocket(util.format('ws://%s:%s/api/v1/ws/console', this.parameters.host, this.parameters.port));
    this.consoleWebsocket.onmessage = this.onConsoleMessage.bind(this);
    this.consoleWebsocket.onopen = this.onConsoleOpen.bind(this);
    this.consoleWebsocket.onerror = this.onConsoleError.bind(this);

    // Contains the console instances
    this.consoleInstances = {};

  }

  createConsole(instanceId) {

    // Add dom node
    $('body').append(util.format('<div id="console-%s" class="console"></div>', instanceId));

    let domNode = $('#console-' + instanceId);

    // The console widget
    this.consoleInstances[instanceId] = domNode.jqconsole(util.format('Inexor Web Console %s\n\n', instanceId), '>>> ');
    
    // Hide the scroll bar!
    domNode.children().css('overflow', 'hidden');

    // Request the console buffer
    this.sendInit(instanceId);

    // Start the prompt
    this.prompt(instanceId);

    setInterval(() => {
      domNode.scrollTop($(document).height());
    }, 1000);

  }

  onConsoleMessage(event) {
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

  onConsoleOpen() {
    this.createConsole(this.parameters.instanceId);
  }

  onConsoleError(error) {
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

  onTreeOpen() {
  }

  onTreeError(error) {
    console.log('Websocket error: ' + error);
  }

  getNode(path) {
    this.treeWebsocket.send(JSON.stringify({
      path: path
    }));
  }

  /**
   * Extracts the URL parameters.
   * @function
   * @name getParameters
   * @returns {object} The parameters.
   */
  getUrlParameters() {
    let parameters = {
      'host': 'localhost',
      'port': 31416,
      'instanceId': null
    };
    let query = window.location.search.split('?');
    if (query.length == 2) {
      let params = query[1].split('&');
      for (var i = 0; i < params.length; i++) {
        let kv = params[i].split('=');
        parameters[kv[0]] = kv[1];
      }
    }
    return parameters;
  }

}
