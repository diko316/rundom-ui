'use strict';

import { Node } from '../struct/node.js';

import { ProcessTask } from './task.js';

import { ProcessSubscription } from './subscription.js';

import {
            IDLE,
            PROCESSING,
            PROCESSED,
            REPROCESSING,
            REPROCESSED,
            REPORTING,
            REPORTED,
            DEAD,
            QUEUE_PROCESS,
            QUEUE_REPROCESS,
            QUEUE_REPORT,
            StateInput,
            STATE_MAP
        } from './task-state.js';

export class ProcessMonitor extends Node {

    constructor() {
        super();

        this.isProcessing = false;
        this.maximimumCycle = 50;

        this.pendingTasks = [];

    }

    onCreateTask(node) {
        node.subscribe(PROCESSING, (node) => {
            console.log('state change? ', node.state);
        });
    }

    onProcess() {
        var me = this,
            pending = me.pendingTasks,
            changed = [],
            rerun = true,
            QueueProcess = StateInput.QueueProcess,
            QueueReport = StateInput.QueueReport,
            cycleLimit = this.maximimumCycle;

        var task, result, changeLength, len, current, depth;

        for (; rerun;) {
            rerun = false;
            changeLength = 0;

            // enqueue all tasks
            depth = 0;
            len = pending.length;

            // preorder queue process
            for (current = me; current;) {
                
                // process pre-order
                if (depth && current.changeState(QueueProcess)) {
                    
                    pending[len++] = current;
                }
    
                // go into first child
                task = current.first;
    
                // go next sibling or parentNode's nextSibling
                if (!task) {
                    task = current.after;
    
                    for (; !task && depth-- && current;) {
                        current = current.parent;
                        task = current.after;
                    }
                }
                // go deeper into node
                else {
                    depth++;
                }
    
                current = task;
            }

            // run tasks
            for (; pending.length;) {
                task = pending.splice(0, 1)[0];

                switch (task.state) {
                case QUEUE_REPROCESS:
                case QUEUE_PROCESS:
                    result = task.process();
                    
                    if (result) {
                        rerun = true;
                        if (!task.isForReporting) {
                            task.isForReporting = true;
                            changed[changeLength++] = task;
                        }
                    }
                }
                
            }

            // run report
            if (!rerun) {
                
                for (; changed.length;) {
                    task = changed.splice(0, 1)[0];
                    delete task.isForReporting;

                    if (task.changeState(QueueReport)) {
                        
                        result = task.report();
                        //console.log('report result ', result, task.state);
                        if (result) {
                            rerun = true;
                        }
                        
                    }
                }

                // never reach cycle limit
                if (--cycleLimit) {
                    rerun = false;
                }
            }

            
        }
    }

    isAdoptable(node) {
        return node instanceof ProcessTask;
    }

    configure(node) {
        if (node instanceof ProcessTask) {
            return node;
        }

        node = new ProcessTask(this);

        this.onCreateTask(node);

        return node;
    }

    enqueue(node) {
        var list = this.pendingTasks;

        if (node instanceof ProcessTask &&
            node.monitor === this) {
            switch (node.state) {

            case QUEUE_PROCESS:
            case QUEUE_REPROCESS:
                list[list.length] = node;
            }

            if (!this.isProcessing) {
                this.isProcessing = true;
    
                this.onProcess();
    
                this.isProcessing = false;
            }

        }

        return this;
    }


}
