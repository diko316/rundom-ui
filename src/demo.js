'use strict';

import { Monitor } from './index';


var test = new Monitor(),
    until = 10;

console.log('good! ', test);

var task = test.create();

function innerRun() {
    console.log('inner');
}


task.observe(function (reprocess) {
    console.log('prime run!');
    
    task.process();
    
    console.log('until ', until);

    if (until--) {
        reprocess();
    }
});

task.observe(function () {
    innerRun();
});


task.process();