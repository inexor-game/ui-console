import tree from '../../../src/tree';
import $ from 'jquery';
import jqConsole from 'jq-console';
import util from 'util';

export default class InexorHud {

  constructor() {

    this.root = new tree.Root();
    this.treeWebsocket = new WebSocket("ws://localhost:31416/api/v1/ws/tree");
    this.treeWebsocket.onmessage = this.onTreeMessage.bind(this);

    this.consoleWebsocket = new WebSocket("ws://localhost:31416/api/v1/ws/console");
    this.consoleWebsocket.onmessage = this.onConsoleMessage.bind(this);

    // Contains the console instances
    this.consoleInstances = {};

    // The instance id
    this.instanceId = this.getInstanceId();
    console.log('Instance ID: ' + this.instanceId);
    
    setTimeout(this.init.bind(this), 200);
  }

  init() {
    this.createConsole(this.instanceId);
  }

  createConsole(instanceId) {

    // Add dom node
    $('body').append(util.format('<div id="console-%s" class="console"></div>', instanceId));

    // The console widget
    this.consoleInstances[instanceId] = $('#console-' + instanceId).jqconsole(util.format('Inexor Web Console %s\n\n', instanceId), '>>> ');
    this.consoleWebsocket.send(JSON.stringify({
      'type': 'get'
    }));    
    this.write(instanceId, 'Console output');
  }

  write(instanceId, message) {
    this.consoleInstances[instanceId].Write(message + '\n', 'jqconsole-output');
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

  onConsoleMessage(event) {
    let request = JSON.parse(event.data);
    switch (request.type) {
      case 'chat':
        this.write(request.instanceId, request.message);
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
          let instanceId = params[i].split('=')[1];
          // this.jqconsole.Write('Instance id: ' + instanceId + '\n', 'jqconsole-output');
          return instanceId;
        }
      }
    }
    // this.jqconsole.Write('No instance id\n', 'jqconsole-output');
    return '';
  }

}
