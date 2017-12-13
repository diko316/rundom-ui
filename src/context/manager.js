'use strict';

import { ProcessMonitor } from '../process/monitor.js';

import { ContextNode } from './node.js';

export class ContextManager {

    constructor() {
        this.monitor = new ProcessMonitor();
    }

    createContext() {
        var context = new ContextNode(this);

        // attach process
        this.monitor.taskRoot.add(context.processor);
        return context;
    }

    destroy() {

    }
}