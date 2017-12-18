'use strict';

import { ProcessMonitor } from '../process/monitor.js';

function demo1() {

    var monitor = new ProcessMonitor(),
        until = 10;
    var unobserve, unobserve2;

    console.log('good! ', monitor);

    var task = monitor.add(),
        task2 = monitor.add();





    function innerRun() {
        console.log('inner');
    }


    unobserve = task.processor(function (reprocess) {
        console.log('!!!!!!!! prime run!');

        if (until) {

            task.process();

        }

        task.process();

        
        console.log('until ', until);

        if (until === 5) {
            console.log('unobserve');
            unobserve();
        }

        if (until--) {
            reprocess();
        }
        else {
            
        }
    });

    task.processor(function () {
        innerRun();
    });

    unobserve2 = task2.processor(function (reprocess) {
        console.log('processing task 2 ', until);

        if (until === 1) {
            console.log('unobserved myself');
            unobserve2();
        }



        if (until--) {
            reprocess();
        }
    });

    task.reporter(function () {
        console.log('task1 is reprocessed');
    });

    task2.reporter(function () {
        console.log('task2 is reprocessed');
    });


    task.process();
}

demo1();