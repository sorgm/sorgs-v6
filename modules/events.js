import typing from './typing.js'

if (!document.customEvents) {
    document.customEvents = {}
}

const VERBOSE = false;
function eventlog(type, eventTarget, action) {
    if (VERBOSE) {
        console.log(`Event "${type}" at "${eventTarget.tagName??'document'}" ${action}.`)
    }
}

const FORBIDDEN_EVENT_TYPES = ["create","get","capture"]

// Eventhandling simplified by binding to an HTMLElement
class BoundEvent extends Event {
    constructor(type, preliminary=false, eventTarget=document) {
        typing.assert(type, String);
        typing.assert(preliminary, Boolean);
        typing.assert(eventTarget, Element, HTMLDocument, Document);

        super(type);
        this.preliminary = preliminary;
        this.eventTarget = eventTarget;
        this.listeners = [];
        this.dispatched = false;
        events[type] = document.customEvents[type] = this;
        events.event_added.dispatchEvent(this);
        eventlog(type, eventTarget, (preliminary?"preliminarily ":"")+"added");
    }

    bindTarget(eventTarget=document) {
        typing.assert(eventTarget, Element, HTMLDocument, Document);

        if (eventTarget == this.eventTarget) return this;

        for (const listener of this.listeners) {
            try {
                this.eventTarget.removeEventListener(this.type, listener);
            }
            catch (e) {
                console.error(e);
            }
            eventTarget.addEventListener(this.type, listener);
        }

        this.eventTarget = eventTarget;
        eventlog(this.type, eventTarget, "bound");
        return this;
    }

    addListener(listener, runOnceIfDispatched = true) {
        typing.assert(listener, Function);
        typing.assert(runOnceIfDispatched, Boolean);

        this.listeners.push(listener);
        this.eventTarget.addEventListener(this.type, listener);
        if (runOnceIfDispatched && this.dispatched) {
            setTimeout(listener,0,this);
        }
        eventlog(this.type, this.eventTarget, "listener added");
        return this;
    }

    removeListener(listener) {
        typing.assert(listener, Function);

        for (let i = 0; i < this.listeners.length; i++) {
            if (this.listeners[i] == listener) {
                this.listeners.splice(i, 1);
            }
        }

        this.event_target.removeEventListener(this.type, listener);
        eventlog(this.type, this.eventTarget, "listener removed");
        return this;
    }

    dispatchEvent(event=this) {
        typing.assert(event, BoundEvent);

        if (BoundEvent.dispatching) {
            const that = this;
            setTimeout(() => that.dispatchEvent(event));
            return true;
        }
        else {
            var result = false;
            BoundEvent.dispatching = true;
            try {
                eventlog((event??this).type, this.eventTarget, "dispatching");
                result = this.eventTarget.dispatchEvent(event??this);
                eventlog((event??this).type, this.eventTarget, "dispatched");
            }
            catch (e) {
                console.error(e);
            }
            this.dispatched = true;
            delete BoundEvent.dispatching;
            return result;
        }
    }

    delete() {
        const e = events[this.type];
    
        for(const listener in e.listeners) {
            this.eventTarget.removeEventListener(this.type, listener);
        }
    
        delete document.customEvents[this.type];
        events.event_deleted.dispatchEvent(this);
        eventlog(this.type, this.eventTarget, "deleted");
    }

    static create(type) {
        // returns event object and adds it as active if needed
        typing.assert(type, String);
        if (type in FORBIDDEN_EVENT_TYPES) {
            throw new TypeError("The chosen type is a reserved keyword.")
        }

        var e
        if (events[type]) {
            e = events[type];
            e.preliminary = false;
        }
        else {
            e = events[type] = document.customEvents[type] = new BoundEvent(type);
        }
        events.event_added.dispatchEvent(e);
        return e;
    }

    static get(type) {
        // returns event object and adds it preliminarily
        typing.assert(type, String);
        
        var e = events[type];
        if (!events[type]) {
            e = events[type] = document.customEvents[type] = new BoundEvent(type, true);
        }
        return e;
    }

    static capture(element, originalType, targetType) {
        const ev = BoundEvent.create(targetType);
        function forwardDispatcher(e) {
            return ev.bindTarget(e.target).dispatchEvent();
        }
        element.addEventListener(originalType, forwardDispatcher);
        return ev;
    }
}

const events = {
    get: BoundEvent.get,
    create: BoundEvent.create,
    capture: BoundEvent.capture
}

events.create("event_added").addListener(e => events[e.type] = e);
events.create("event_deleted").addListener(e => delete events[e.type])

Object.keys(document.customEvents).forEach(k => events[k] = document.customEvents[k]);

export default events;