var pointer = function() {
    'use strict';

    var mouse_position          = {x: 1, y: 1},
        event_queue             = [],
        default_interval        = 20,
        first_event_offset      = 50,
        default_flick_duration  = 200,
        default_click_duration  = Math.random() * (250 - 20) + 20,
        default_screen_x_offset = 1,
        default_screen_y_offset = 30;


    function send_event(type, clientX, clientY, element, button, screenX, screenY, isTouchEvent, scrollLeft, scrollTop) {
        if (type == 'scroll') {
            window.scrollTo(scrollLeft, scrollTop);
            return;
        }


        if (!screenX) {
            screenX = clientX + default_screen_x_offset;
        }
        if (!screenY) {
            screenY = clientY + default_screen_y_offset;
        }


        if (!button && ( type === 'click' || type === 'mousedown' || type === 'mouseup') ) {
            button = 0;
        }


        var detail = (type !== 'mousemove' && type !== 'touchmove') ? 1 : 0;


        if (isTouchEvent &&
            ( ('ontouchstart' in window) || (navigator.msMaxTouchPoints > 0) )
        ) {

            var eventObject = document.createEvent("TouchEvent");
            eventObject.initTouchEvent(type,  true, true, window, detail, screenX, screenY, clientX, clientY, false, false, false, false, button, null);
        } else {
            var eventObject = document.createEvent("MouseEvent");
            eventObject.initMouseEvent(type,  true, true, window, detail, screenX, screenY, clientX, clientY, false, false, false, false, button, null);
        }

        if (element) {
            element.dispatchEvent(eventObject);

        } else {
            document.body.dispatchEvent(eventObject);
        }

        mouse_position = {x: screenX, y: screenY};
    }


    function process_event_queue() {
        if (event_queue.length) {
            var current_event = event_queue[0],
                next_event    = event_queue[1];

            send_event(current_event.type, current_event.pageX, current_event.pageY, current_event.target, null, current_event.screenX, current_event.screenY, current_event.isTouchEvent, current_event.scrollLeft, current_event.scrollTop);

            if (next_event) {
                var offset = next_event.timestamp - current_event.timestamp;
                setTimeout(process_event_queue, offset);
            }
            event_queue.shift();
        }
    }

    function get_offset_of_element(element) {

        var body_rect = document.body.getBoundingClientRect(),
            elem_rect = element.getBoundingClientRect(),
            y_offset  = elem_rect.top - body_rect.top,
            x_offset  = elem_rect.left - body_rect.left;


        return {x: x_offset, y: y_offset};
    }


    function build_mouse_movement_queue(element, duration, is_mobile) {

        var element_offset = get_offset_of_element(element);


        var x_distance = element_offset.x - mouse_position.x,
            y_distance = element_offset.y - mouse_position.y;


        var increments = duration / default_interval;
        for (var i = 1; i <= increments; i++) {
            var new_x_pos = Math.round(x_distance / increments * i) + mouse_position.x,
                new_y_pos = Math.round(y_distance / increments * i) + mouse_position.y;

            event_queue.push({
                type:           "mousemove",
                pageX:          new_x_pos,
                pageY:          new_y_pos,
                screenX:        new_x_pos + default_screen_x_offset,
                screenY:        new_y_pos + default_screen_y_offset,
                timestamp:      i * default_interval
            });
        }

    }


    function build_click_event_queue(element, duration, is_mobile) {

        var element_offset = get_offset_of_element(element);


        var last_timestamp = (event_queue.length) ? event_queue[event_queue.length - 1].timestamp : 0;

        if (!duration) {
            duration = default_click_duration;
        }

        if (is_mobile) {
            var screen_x = element_offset.x,
                screen_y = element_offset.y;

            event_queue.push({
                type:           "touchstart",
                pageX:          element_offset.x,
                pageY:          element_offset.y,
                screenX:        screenX,
                screenY:        screenY,
                timestamp:      last_timestamp,
                target:         element,
                isTouchEvent: true
            });

            event_queue.push({
                type:           "touchmove",
                pageX:          element_offset.x,
                pageY:          element_offset.y,
                screenX:        screenX,
                screenY:        screenY,
                timestamp:      last_timestamp + Math.floor(default_click_duration / 2),
                target:         element,
                isTouchEvent: true
            });

            event_queue.push({
                type:           "touchend",
                pageX:          element_offset.x,
                pageY:          element_offset.y,
                screenX:        screenX,
                screenY:        screenY,
                timestamp:      last_timestamp + default_click_duration,
                target:         element,
                isTouchEvent: true
            });


        } else {
            var screen_x = element_offset.x + default_screen_x_offset,
                screen_y = element_offset.y + default_screen_y_offset;
        }

        event_queue.push({
            type:           "mouseover",
            pageX:          element_offset.x,
            pageY:          element_offset.y,
            screenX:        screenX,
            screenY:        screenY,
            timestamp:      last_timestamp + default_click_duration + 10,
            target:         element,
            isTouchEvent: false
        });

        event_queue.push({
            type:           "mousemove",
            pageX:          element_offset.x,
            pageY:          element_offset.y,
            screenX:        screenX,
            screenY:        screenY,
            timestamp:      last_timestamp + default_click_duration + 20,
            target:         element,
            isTouchEvent: false
        });

        event_queue.push({
            type:           "mousedown",
            pageX:          element_offset.x,
            pageY:          element_offset.y,
            screenX:        screenX,
            screenY:        screenY,
            timestamp:      last_timestamp + default_click_duration + 20,
            target:         element,
            isTouchEvent: false
        });

        event_queue.push({
            type:           "mouseup",
            pageX:          element_offset.x,
            pageY:          element_offset.y,
            screenX:        screenX,
            screenY:        screenY,
            timestamp:      last_timestamp + (default_click_duration * 2),
            target:         element,
            isTouchEvent: false
        });

        event_queue.push({
            type:           "click",
            pageX:          element_offset.x,
            pageY:          element_offset.y,
            screenX:        screenX,
            screenY:        screenY,
            timestamp:      last_timestamp + (default_click_duration * 2) + 10,
            target:         element,
            isTouchEvent: false
        });


    }


    function build_flick_event_queue(element, duration) {

        var body_rect = document.body.getBoundingClientRect(),
            elem_rect = element.getBoundingClientRect(),
            y_offset  = elem_rect.top - body_rect.top,
            x_offset  = elem_rect.left - body_rect.left;


        var x_distance = x_offset - mouse_position.x,
            y_distance = y_offset - mouse_position.y;

        if (!duration) duration = default_flick_duration;

        event_queue.push({
            type:           "touchstart",
            pageX:          mouse_position.x,
            pageY:          mouse_position.y,
            screenX:        mouse_position.x,
            screenY:        mouse_position.y,
            timestamp:      0,
            target:         element,
            isTouchEvent: true
        });

        var increments = duration / default_interval;
        for (var i = 1; i <= increments; i++) {
            var new_x_pos = Math.round(x_distance / increments * i) + mouse_position.x,
                new_y_pos = Math.round(y_distance / increments * i) + mouse_position.y;

            event_queue.push({
                type:           "touchmove",
                pageX:          new_x_pos,
                pageY:          new_y_pos,
                screenX:        new_x_pos,
                screenY:        new_y_pos,
                timestamp:      i * default_interval,
                target:         element,
                isTouchEvent: true
            });
        }

        var last_timestamp = (event_queue.length) ? event_queue[event_queue.length - 1].timestamp : 0;

        event_queue.push({
            type:           "touchend",
            pageX:          x_offset,
            pageY:          y_offset,
            screenX:        x_offset,
            screenY:        y_offset,
            timestamp:      last_timestamp,
            target:         element,
            isTouchEvent: true
        });
    }

    function find_element(selector){
        var element = document.querySelectorAll(selector);
        return element[0];
    }

    function get_element(){
        var elements = document.querySelectorAll("a");
        return elements[Math.floor(Math.random() * elements.length)];
    }

    function duration(){
        return Math.floor(Math.random() * (3000 - 1000) + 1000);
    }

    function start_processing_events() {
        setTimeout(process_event_queue, first_event_offset);
    }

    return {
        move_to_random_element_and_click: function() {
            var element = get_element();
            build_mouse_movement_queue(element, duration());
            build_click_event_queue(element);
            start_processing_events();
        },

        move_mouse_to_random_element: function() {
            var element = get_element();
            build_mouse_movement_queue(element, duration());
            start_processing_events();
        },

        move_mouse_to_element: function(selector) {
            var element = find_element(selector);
            build_mouse_movement_queue(element, duration);
            start_processing_events();
        },

        click_element: function(selector) {
            var element = find_element(selector);
            build_click_event_queue(element);
            start_processing_events();
        },

        run_serialized_events: function(events) {
            if (!events || ! events instanceof Array) return;

            event_queue = events;
            start_processing_events();
        }
    }
}();