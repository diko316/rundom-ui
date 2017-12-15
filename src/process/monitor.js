'use strict';

import { ProcessTask } from './task';

export class ProcessMonitor {

    constructor() {

        this.taskRoot = this.createProcess();
        this.isRunning = false;
        this.processing = [];
    }

    onCreateProcess(task) {

    }

    onRunProcess() {
        var running = this.processing,
            reports = [],
            reportLength = 0,
            processTasks = true;
        var node, requestingReprocess,
            len, depth, current;

        for (; processTasks;) {

            processTasks = false;

            depth = 0;
            len = running.length;
            
            // preorder queue process
            for (current = this.taskRoot; current;) {
                
                // process pre-order
                if (!current.isPending) {
                    current.isPending = true;
                    running[len++] = current;
                }
    
                // go into first child
                node = current.first;
    
                // go next sibling or parentNode's nextSibling
                if (!node) {
                    node = current.after;
    
                    for (; !node && depth-- && current;) {
                        current = current.parent;
                        node = current.after;
                    }
                }
                // go deeper into node
                else {
                    depth++;
                }
    
                current = node;
            }

            // process queue
            for (; running.length;) {
                node = running.splice(0, 1)[0];

                // reprocess from structure change
                if (node.orphan) {
                    processTasks = true;

                }
                else {

                    requestingReprocess = node.process();
                    node.isPending = false;

                    if (requestingReprocess) {
                        processTasks = true;
                        if (reports.indexOf(node) === -1) {
                            reports[reportLength++] = node;
                        }
                    }
                    
                }

            }

            // reporting changes to node
            if (!processTasks) {

                for (; reports.length;) {
                    node = reports.splice(0, 1)[0];
                    
                    if (node.isAlive) {
                        node.report();
                    }
                }

            }

        }

    }

    
    onQueueAllProcess(queue) {

        var len = queue.length,
            depth = 0;
        var current, node;

        // pre order traverse and enqueue all process
        for (current = this.taskRoot; current;) {
            
            // process pre-order
            if (current.isAlive && !current.isPending) {
                current.isPending = true;
                queue[len++] = current;
            }

            // go into first child
            node = current.first;

            // go next sibling or parentNode's nextSibling
            if (!node) {
                node = current.after;

                for (; !node && depth-- && current;) {
                    current = current.parent;
                    node = current.after;
                }
            }
            // go deeper into node
            else {
                depth++;
            }

            current = node;
        }

    }

    createProcess() {
        var task = new ProcessTask(this);
        this.onCreateProcess(task);
        return task;
    }

    create() {
        var task = this.createProcess();

        // attach to root;
        this.taskRoot.add(task);

        return task;

    }

    remove(task) {
        
        this.taskRoot.remove(task);

        return task;
    }

    queue(node) {
        var running = this.processing;

        // queue for next process
        if (node instanceof ProcessTask && node.isAlive && !node.isPending) {

            // insert to current process
            node.isPending = true;
            running[running.length] = node;

            // create thread
            if (!this.isRunning) {
                
                this.isRunning = true;

                // run pending process
                this.onRunProcess();

                this.isRunning = false;

            }
        }

    }




}