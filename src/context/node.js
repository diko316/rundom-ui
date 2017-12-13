'use strict';

import {
            string,
            object,
            jsonSet,
            jsonUnset,
            assign
        } from 'libcore';

export class ContextNode {

    constructor(manager) {
        var processor = manager.monitor.createProcess();

        this.manager = manager;
        this.processor = processor;
        this.state = {};
        processor.context = this;
    }

    onDestroy(processor) {
        var context, node;

        // destroy child nodes
        for (node = processor.last; node; node = node.before) {
            context = node.context;
            if (context) {
                context.destroy();
            }
        }

    }

    onCreateChild() {

    }

    destroy() {
        var processor = this.processor;

        // remove children
        if (processor && processor.isAlive) {
            this.onDestroy(processor);

            processor.destroy();

            this.processor =
                processor =
                processor.context = null;
        }
    }

    createChild() {
        var context = new (this.constructor)(this.manager);

        this.onCreateChild(context);
        this.processor.add(context.processor);
        
        return context;
    }


    update(path, value) {
        var state = this.state,
            processor = this.processor,
            removeValue = typeof value === 'undefined',
            applied = false;

        if (processor) {

            if (string(path)) {
                applied = removeValue ?
                                jsonUnset(path, state) :
                                jsonSet(path, state, value, true);
            }
            else if (object(path)) {
                applied = true;
                assign(state, value);
            }

            // process changes
            if (applied) {
                processor.process();
            }
        }
    }
    
}