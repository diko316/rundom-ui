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

    queue(node) {
        var running = this.processing;

        // create thread
        if (!this.isRunning) {
            this.isRunning = true;

            if (node.isAlive && !node.isPending) {
                node.isPending = true;
                running[running.length] = node;
            }

            this.onQueueAllProcess(running);

            // run pending process

            this.isRunning = false;
        }

    }




}