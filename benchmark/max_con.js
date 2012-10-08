/**
 * Created with JetBrains WebStorm.
 * User: david
 * Date: 18/09/12
 * Time: 12:44
 * To change this template use File | Settings | File Templates.
 */

var rest = require('restler');
var config = require('./config.js');
var http = require('http');
http.globalAgent.maxSockets = 40000;

var num_con = config.max_con.numCon;
var completed = 0;
var ok = 0;

var pop = function () {
    rest.post(config.protocol + '://' + 'localhost' + ':' +
        '3001' + '/queue/qx/pop?timeout=120').on('complete', function(err, response){
            completed++;

            if (err.ok == true) {
                ok++;
            }

            if (num_con == completed) {
                console.log('The system can handle ' + ok + ' simultaneous connections.');
            }
        });

}

for(var i = 0; i < num_con; i++){
    setTimeout(function(){
        pop();
    }, i*2);
}