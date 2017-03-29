$(document).ready(function () {

  /**
   * The Inexor Web Console is a web interface for the Inexor Flex
   * command line API.
   * 
   * @class
   */
  class InexorWebConsole {

    /**
     * The constructor.
     */
    constructor() {

      /**
       * The console widget.
       */
      this.jqconsole = $('#console').jqconsole('Inexor Web Console\n', '>>> ');

      /**
       * The instance id.
       */
      this.instanceId = this.getInstanceId();

      /**
       * The timeout for console requests.
       */
      this.timeout = 250;

    };

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
            this.jqconsole.Write('Instance id: ' + instanceId + '\n', 'jqconsole-output');
            return instanceId;
          }
        }
      }
      this.jqconsole.Write('No instance id\n', 'jqconsole-output');
      return '';
    };

    /**
     * Sends a command and receives the console buffer in return.
     * @function
     * @name sendAndReceive
     * @param {string} input The input string.
     */
    sendAndReceive(input) {
      let self = this;
      if (input != null && input != '') {
        $.ajax({
          type: 'POST',
          url: 'http://localhost:31416/console/' + this.instanceId,
          data: { 'command': input },
          dataType: 'json',
          cache: false,
          timeout: this.timeout,
          success: function(data, status) {
            if (status == 200) {
              self.jqconsole.reset();
              self.jqconsole.Write(data.buffer, 'jqconsole-output');
              self.jqconsole.SetPromptLabel(data.prompt);
            };
          },
          error: function(err) {
            self.jqconsole.Write('Error: ' + err.statusText + '\n', 'jqconsole-output');
          },
          complete: function() {
            // Shows the prompt with history enabled.
            self.jqconsole.Prompt(true, (next_input) => { self.sendAndReceive(next_input) });
          }
        });
      } else {
        self.jqconsole.Prompt(true, (next_input) => { self.sendAndReceive(next_input) });
      }
    };
    
  };

  let inexorWebConsole = new InexorWebConsole();
  inexorWebConsole.sendAndReceive('');

});


