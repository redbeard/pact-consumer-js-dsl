'use strict';

Pact.MockService = Pact.MockService || {};

(function() {

  var _baseURL = 'http://127.0.0.1:';

  this.interactions = [];
  this.pactDetails = {};

  this.init = function(opts) {
    _baseURL += opts.port;

    this.pactDetails = {
      consumer: {
        name: opts.consumerName
      },
      provider: {
        name: opts.providerName
      },
      pact_dir: opts.pactDir ? opts.pactDir : '.'
    };

    return this;
  };

  this.given = function(providerState) {
    var interaction = Pact.givenInteraction(providerState);
    this.interactions.push(interaction);
    return interaction;
  };

  this.uponReceiving = function(description) {
    var interaction = Pact.receivingInteraction(description);
    this.interactions.push(interaction);
    return interaction;
  };

  this.clean = function() {
    var xhr = new XMLHttpRequest();
    xhr.open('DELETE', _baseURL + '/interactions', false);
    xhr.setRequestHeader('X-Pact-Mock-Service', true);
    xhr.send();
    if (200 !== xhr.status) {
      throw 'pact-js-dsl: Pact cleanup failed. ' + xhr.responseText;
    }
  };

  this.setup = function() {
    var xhr, interactions = this.interactions;
    this.interactions = []; //Clean the local setup

    interactions.forEach(function(interaction) {
      xhr = new XMLHttpRequest();
      xhr.open('POST', _baseURL + '/interactions', false);
      xhr.setRequestHeader('X-Pact-Mock-Service', true);
      xhr.setRequestHeader('Content-type', 'application/json');
      xhr.send(JSON.stringify(interaction));
      if (200 !== xhr.status) {
        throw 'pact-js-dsl: Pact interaction setup failed. ' + xhr.responseText;
      }
    });
  };

  this.verify = function() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', _baseURL + '/interactions/verification', false);
    xhr.setRequestHeader('X-Pact-Mock-Service', true);
    xhr.send();
    if (200 !== xhr.status) {
      throw 'pact-js-dsl: Pact verification failed. ' + xhr.responseText;
    }
  };

  this.write = function() {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', _baseURL + '/pact', false);
    xhr.setRequestHeader('X-Pact-Mock-Service', true);
    xhr.setRequestHeader('Content-type', 'application/json');
    xhr.send(JSON.stringify(this.pactDetails));
    if (200 !== xhr.status) {
      throw 'pact-js-dsl: Could not write the pact file. ' + xhr.responseText;
    }
  };

  this.run = function(testFn) {
    var self = this;
    self.clean(); // Cleanup the interactions from the previous test
    self.setup(); // Post the new interactions

    var complete = function() {
      self.verify(); //Verify that the expected interactions have occurred
    };

    testFn(complete); // Call the tests
  };

}).apply(Pact.MockService);
