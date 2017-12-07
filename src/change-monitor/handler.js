'use strict';

import { Node } from '../struct/node.js';


export class ChangeMonitorHandler extends Node {

    isAdoptable(node) {
        return node instanceof ChangeMonitorHandler;
    }

}
