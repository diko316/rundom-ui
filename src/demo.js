'use strict';

import { Monitor } from './index';


var test = new Monitor(),
    until = 10;

console.log('good! ', test);

var task = test.create();

function innerRun() {
    console.log('inner');
}


task.observe(function () {
    console.log('prime run!');
    
    task.run();
    

    return until--;
});

task.observe(function () {
    innerRun();
});


task.run();