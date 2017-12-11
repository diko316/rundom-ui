'use strict';

import { Node } from '../struct/node.js';

import { method } from 'libcore';

function doNothing() {

}

export class ProcessTask extends Node {

    constructor(monitor) {
        this.taskMonitor = monitor;
        this.microTasks = [];
        this.isPending = false;
        this.isProcessing = false;
    }

    // runs synchronous tasks
    onProcess(status) {
        var list = this.microTasks,
            running = list.slice(0);
        var task, result, callback;
        
        for (; running.length; ) {
            task = running.splice(0, 1)[0];

            if (task[1]) {

                result = false;
                callback = task[0];

                try {
                    result = callback();
                }
                catch (e) {
                    console.warn(e);
                }

                if (result) {
                    status.rerun = true;
                }
            }
        }


    }

    isAdoptable(node) {
        return node instanceof ProcessTask;
    }

    taskIndexOf(handler) {
        var list = this.microTasks,
            l = list.length;

        for (; l--;) {
            if (list[l][0] === handler) {
                return l;
            }
        }

        return -1;
    }

    observe(handler) {
        var list = this.microTasks;
        var task;

        if (method(handler) && this.taskIndexOf(handler) === -1) {
            task = [handler, true, false];

            list[list.length] = task;

            return () => this.unobserve(handler);
        }

        return doNothing;
    }

    unobserve(handler) {
        var list = this.microTasks,
            index = this.taskIndexOf(handler);
        var item;

        if (index !== -1) {
            item = list[index][1] = false;
            list.splice(index, 1);
        }

        return this;
    }

    process() {
        var isPending = this.isPending;
        var status;

        if (isPending && !this.isProcessing) {
            this.isProcessing = true;
            status = { rerun: false };

            this.onProcess(status);

            this.isProcessing = false;
            isPending = status.rerun;
           
        }

        if (isPending) {
            this.monitor.queue(this);
        }
    }

}
