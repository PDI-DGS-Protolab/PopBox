var maxProvision = require('./maxProvision.js');
var maxPop = require('./maxPop.js');
var sender = require('./sender.js');
var config = require('./config.js');
var net = require('net');

var webSocket;

var receiveMessage = sender.receiveMessage;
var sendMessage = sender.sendMessage;

sender.createSocket(8090, function (socket) {
    'use strict';
    webSocket = socket;
    exports.webSocket = webSocket;

    receiveMessage(webSocket, 'newTest', function (data) {

        sendMessage(webSocket, 'init', {nAgents: config.agentsHosts.length, interval: 3});

        createAndLaunchAgents(function () {
            console.log('Callback has been called');
            switch (data.id) {
                case 1:
                    maxProvision.doNtimes(config.maxProvision.start_number_provisions, config.payload_length, function (data) {
                        sendMessage(webSocket, 'newPoint', data);
                    });
                    break;
                case 2:
                    maxPop.doNtimes(config.maxPop.start_number_pops, config.payload_length, function (data) {
                        sendMessage(webSocket, 'newPoint', data);
                    });
                    break;
            }
        });
    });
});

var createAndLaunchAgents = function (callback) {
    'use strict';
    var hostsRec = 0, i = 0, host, client, redisServers, monitorHosts = [];

    if (!config.launchWithDeployment) {
        callback();
    } else {

        for (i = 0; i < config.agentsHosts.length; i++) {
            host = config.agentsHosts[i].host;

            client = new net.Socket();
            client.connect(8091, host, function (client) {

                //Receive CPU and MEM information and send it to the client
                client.on('data', function (data) {

                    var JSONdata = JSON.parse(data);

                    if (JSONdata.id === 1) {
                        monitorHosts.push(JSONdata.host);
                        hostsRec++;

                        if (hostsRec === config.agentsHosts.length) {
                            sendMessage(webSocket, 'hosts', {hosts: monitorHosts});
                            setTimeout(callback,3000);
                        }

                    } else if (JSONdata.id === 2) {

                        sendMessage(webSocket, 'cpu', {host: JSONdata.host, time: 1, cpu: JSONdata.cpu.percentage});
                        sendMessage(webSocket, 'memory', {host: JSONdata.host, time: 1, memory: JSONdata.memory.value});
                    }
                });

                //redisServers = {trans: config.redisTrans, queues: config.redisServers};
                //client.write(JSON.stringify(redisServers));

            }.bind({}, client));
        }
    }
}