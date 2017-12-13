'use strict';

import { ProcessMonitor } from './process/monitor.js';

function demo1() {

    var test = new ProcessMonitor(),
        until = 10;
    var unobserve;

    console.log('good! ', test);

    var task = test.create();

    function innerRun() {
        console.log('inner');
    }


    unobserve = task.observe(function (reprocess) {
        console.log('prime run!');
        
        task.process();
        
        console.log('until ', until);

        if (until === 5) {
            console.log('unobserve');
            unobserve();
        }

        if (until--) {
            reprocess();
        }
    });

    task.observe(function () {
        innerRun();
    });


    task.process();
}

demo1();