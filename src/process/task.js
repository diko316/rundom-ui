'use strict';

import { Node } from '../struct/node.js';

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
            StateInput,
            STATE_MAP
        } from './task-state.js';

import {
            string,
            contains
        } from 'libcore';


export class ProcessTask extends Node {

    constructor(monitor) {
        super();
        this.state = IDLE;
        this.monitor = monitor;
        
        this.onInitialize();
    }

    onDestroy() {
        var me = this,
            task = me.task;

        me.changeState(StateInput.Die);

        task.process.destroy();
        task.report.destroy();
        task.statechange.destroy();

        super.onDestroy();
    }
    
    onInitialize() {
        var Subscription = ProcessSubscription,
            me = this,
            task = {
                process: new Subscription(),
                report: new Subscription(),
                statechange: new Subscription()
            };

        me.task = task;
        me.processStatus = null;
        me.reportStatus = null;
    }

    onProcess(requestReprocess) {
        this.task.process.broadcast(requestReprocess);
    }

    onReport(requestReprocess) {
        this.task.report.broadcast(requestReprocess);
    }

    isAdoptable(node) {
        return node instanceof ProcessTask;
    }

    subscribe(state, handler) {

        if (string(state) && contains(STATE_MAP, state)) {

            return this.task.statechange.
                        subscribe(runningState => runningState === state ?
                                                        handler(this) : null);
        }

        throw new Error('[state] parameter is not a known task state');
    }

    processor(handler) {
        return this.task.process.subscribe(handler);
    }

    reporter(handler) {
        return this.task.report.subscribe(handler);
    }

    process() {

        var Input = StateInput,
            ProcessInput = Input.Process,
            QueueInput = Input.QueueProcess,
            me = this,
            status = me.processStatus,
            monitor = me.monitor,
            reportStatus = me.reportStatus;

        // can enqueue
        if (me.nextState(QueueInput)) {
            me.changeState(QueueInput);
            monitor.enqueue(me);

        }
        else if (me.nextState(ProcessInput)) {
            me.changeState(ProcessInput);
            me.processStatus = status = { reprocess: false };
            
            me.onProcess(() => status.reprocess = true);

            me.processStatus = null;

            // end process
            if (me.changeState(Input.EndProcess)) {
                return status.reprocess;
            }

        }
        else if (this.state === REPORTING && reportStatus) {
            reportStatus.reprocess = true;
        }
        
        return false;
        
    }

    report() {
        var Input = StateInput;
        var status;

        if (this.changeState(Input.Report)) {

            this.reportStatus = status = { reprocess: false };

            this.onReport(() => status.reprocess = false);

            this.reportStatus = null;

            this.changeState(Input.EndReport);

            return status.reprocess;

        }

        return false;
    }

    nextState(input) {
        var old = this.state,
            reference = STATE_MAP[old];

        if (input !== old && contains(reference, input)) {
            return reference[input];
        }

        return false;
    }

    changeState(input) {
        var state = this.nextState(input);
        var old;

        if (state) {
            old = this.state;
            this.state = state;
            this.task.statechange.broadcast(state, old);
            return state;
            
        }

        return false;

    }


}
