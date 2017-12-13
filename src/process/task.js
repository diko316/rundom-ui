'use strict';

import { Node } from '../struct/node.js';

import { method } from 'libcore';

function doNothing() {

}

function createReprocessFlagCallback(status) {
    function reprocess() {
        status.rerun = true;
    }
    return reprocess;
}

export class ProcessTask extends Node {

    constructor(monitor) {
        super();

        this.taskMonitor = monitor;
        this.microTasks = [];
        this.reporters = [];
        this.isPending = false;
        this.isProcessing = false;
        this.reprocessed = false;

    }

    // runs synchronous tasks
    onProcess(statusChangeCallback) {
        var me = this,
            list = me.microTasks,
            running = list.slice(0);
        var task, callback;
        
        for (; running.length; ) {
            task = running.splice(0, 1)[0];

            // do not process when orphaned
            if (me.orphan) {
                break;
            }

            if (task[1]) {
                callback = task[0];

                try {
                    callback(statusChangeCallback);
                }
                catch (e) {
                    console.warn(e);
                }

            }
        }

    }

    onReport(statusChangeCallback) {
        var me = this,
            list = me.reporters.slice(0);

        var handler, callback;

        for (; list.length;) {
            handler = list.splice(0, 1)[0];
            if (me.orphan) {
                break;
                
            }
            if (handler[1]) {
                callback = handler[0];

                try {
                    callback(statusChangeCallback);
                }
                catch (e) {
                    console.warn(e);
                }
            }
        }
    }

    onDestroy() {
        var tasks = this.microTasks,
            reporters = this.reporters;
        var len, list;

        for (list = tasks, len = list.length; len--;) {
            this.unobserve(tasks[len]);
        }

        for (list = reporters, len = list.length; len--;) {
            this.unsubscribe(tasks[len]);
        }

        super.onDestroy();
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

    reporterIndexOf(handler) {
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

    subscribe(handler) {
        var list = this.reporters;

        if (method(handler)) {
            list[list.length] = [handler, true];

            return () => this.unsubscribe(handler);
        }

        return doNothing;
    }

    unsubscribe(handler) {
        var list = this.reporters,
            index = this.reporterIndexOf(handler);

        if (index !== -1) {
            list[index][1] = false;
            list.splice(index, 1);
        }
        return this;
    }

    process() {
        var monitor = this.taskMonitor;
        var status;

        if (this.isAlive && !this.orphan) {
            if (!monitor.isRunning) {
                monitor.queue(this);

            }
            else if (this.isPending && !this.isProcessing) {

                status = { rerun: false };

                this.isProcessing = true;
                this.reprocessed = false;

                this.onProcess(createReprocessFlagCallback(status));
                this.reprocessed = status.rerun;
                
                this.isProcessing = false;

                return status.rerun;

            }
        }

        return false;

    }

    report() {
        var status;

        if (this.isAlive && !this.orphan) {
            status = { rerun: false };
            this.onReport(createReprocessFlagCallback(status));
            return status.rerun;
        }

        return false;

    }


}
