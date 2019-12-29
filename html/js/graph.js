
'use strict'

// graphentry object
// creates a new object representing an entry in a graph object
function graphentry (value, displayvalue) {
    if (typeof displayvalue == 'undefined')
        displayvalue = function (x) { return x }
    return {
        value: value,
        displayvalue: displayvalue
    }
}

// graphmarker objects are used to store the location and text of a horizontal
//   marker 
function graphmarker (text, value) {
    return {
        text: text,
        value: value
    }
}

// create a graph object
// inputs are the parent html object of the html part of this graph object and
//   the minimum and maximum values of the graph (bottom and top resp.)
// max and min are optional params
// the object rememebers which html element is tied to it
function graph (parent, max, min) {
    if (typeof max == 'undefined')
        max = 1
    if (typeof min == 'undefined')
        min = 0
    // quick check to see max and min values are actually valid
    if (!(max > min))
        console.error('maximum and minimum values are invalid: max=' + max +
            ', min=' + min)
    // create new html object for the graph to reside in and tie it to the
    //   resulting object
    var htmlref = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    htmlref.setAttribute('class', 'graph_object')
    htmlref.style.width = '100%'
    htmlref.style.height = '100%'
    parent.append(htmlref)
    // add groups for different parts of the graph
    var classes = ['graph_lines', 'graph_lines_under', 'graph_markers', 
        'graph_value_display']
    var classref
    for (var i = 0; i < classes.length; i++) {
        classref = document.createElementNS('http://www.w3.org/2000/svg', 'g')
        classref.setAttribute('class', classes[i])
        htmlref.appendChild(classref)
    }
    return {
        // stores all of the entries of the graph, from left to right, in the 
        //   format of the graphentry object
        entries: [],
        style: { // default values
            // amount of space to leave between entries in the graph (in px)
            entry_width: 10,
            // width of the graph's line
            linewidth: 3,
            // a small dot (twice the size of the line) on every entry value in
            //   the graph
            dots: false,
            // color of the line
            linecolor: 'rgb(139, 140, 224)',
            // color of the area under the line ('transparent' will show
            //   nothing)
            undercolor: 'rgba(139, 140, 224, 0.3)',
            // background color of the graph
            background: '#f3f3f3',
            // text with the last entry's value on the right just above the
            //   line of the graph
            value_text: false
        },
        // maximum value (top) of the graph
        max: max,
        // minimum value (bottom) of the graph
        min: min,
        // reference to the SVG html object associated with this graph
        htmlref: htmlref,
        // return amount of entries in the graph
        length: function () { return this.entries.length },
        // return the nth entry in the graph from left to right (negative for
        //   from right to left)
        get: function (n) {
            if (n < 0)
                return this.entries[this.entries.length - n]
            else
                return this.entries[n]
        },
        // get the width or height of the html object of the graph (in px)
        width: function () { return $(this.htmlref).width() },
        height: function () { return $(this.htmlref).height() },
        // render the lines of the graph, smoothing them with circles, these are
        //   also rendered in this function
        render_lines: function () {
            var w = this.width(), h = this.height()
            var d = 'M 0 ' + h + ' '
            d += 'L ' + (w - this.length() * this.style.entry_width) + ' ' + h
                + ' '
            var htm = ''
            // radius of the circle depends on if the style.dots is enabled
            var r = this.style.linewidth * 0.5
            if (this.style.dots)
                r *= 2
            for (var i = 0; i < this.length(); i++) {
                // calculate the path for the actual lines
                d += 'L ' + (w - this.style.entry_width * (this.length() - i
                    - 1)) + ' ' + (h - (this.entries[i].value - this.min)
                    / (this.max - this.min) * h) + ' '
                // render new circle in the location of the point
                htm += '<circle cx="' + (w - this.style.entry_width
                    * (this.length() - i - 1)) + '" cy="' + (h 
                    - (this.entries[i].value - this.min) / (this.max - this.min)
                    * h) + '" r="' + r + '" style="fill: '
                    + this.style.linecolor + '" />'
            }
            // add the path to the html
            htm += '<path d="' + d + '" style="stroke: ' + this.style.linecolor
                + '; stroke-width: ' + this.style.linewidth
                + '; fill: none" />'
            // replace html of the lines part of the svg
            $(this.htmlref).find('.graph_lines').html(htm)
        },
        // render the color under the graph line (can be transparent but will
        //   still be calculated and rendered)
        render_lines_under: function () {
            var w = this.width(), h = this.height()
            var d = 'M 0 ' + h + ' ' + 'L ' + (w - this.length()
                * this.style.entry_width) + ' ' + h + ' '
            // calculate the path part which is the same as for the lines
            for (var i = 0; i < this.length(); i++) {
                d += 'L ' + (w - this.style.entry_width * (this.length() - i
                    - 1)) + ' ' + (h - (this.entries[i].value - this.min)
                    / (this.max - this.min) * h) + ' '
            }
            // add the right and bottom lines to make it a full shape
            d += 'L ' + w + ' ' + h + ' Z'
            var htm = '<path d="' + d + '" style="stroke: transparent; fill: ' +
                this.style.undercolor + '" />'
            // replace html of the lines part of the svg
            $(this.htmlref).find('.graph_lines_under').html(htm)
        },
        // render the markers, which are horizontal lines indicating certain
        //   values, this includes the text above the lines
        render_markers: function () {
            var w = this.width(), h = this.height()
            var hloc
            var htm = ''
            for (var i = 0; i < this.markers.length; i++) {
                // calculate the y location of the line
                hloc = (1 - this.markers[i].value / this.max) * h
                // render the line
                htm += '<path d="M 0 ' + hloc + ' L ' + w + ' ' + hloc +
                    '" style="stroke: #ccc; fill: none; stroke-width: ' +
                    (this.style.linewidth * 0.5) + '" />'
                // render the text above the line
                htm += '<text x="3" y="' + (hloc - this.style.linewidth * 0.5 -
                    3) + '" style="fill: #aaa; font-size: 12px; ' +
                    'font-family: sans-serif">' +
                    this.markers[i].text + '</text>'
            }
            // add generated html to the svg html element
            $(this.htmlref).find('.graph_markers').html(htm)
        },
        // render the value display text above the line (if it is enabled)
        render_value_display: function () {
            if (!this.style.value_text)
                return
            var hloc = (1 - this.entries[this.entries.length - 1].value
                / this.max) * this.height()
            var htm = '<text x="' + (this.width() - 3) + '" y="' + (hloc
                - this.style.linewidth - 3) + '" style="fill: '
                + this.style.linecolor + '; ' + 'font-size: 14px; '
                + 'font-family: sans-serif; font-weight: bold" '
                + 'text-anchor="end">'
                + this.entries[this.entries.length - 1].displayvalue(
                    this.entries[this.entries.length - 1].value)
                + '</text>'
            $(this.htmlref).find('.graph_value_display').html(htm)
        },
        // render the graph in the htmlref SVG object, using the entries stored
        //   in this object
        render: function () {
            this.render_lines()
            this.render_lines_under()
            this.render_markers()
            this.render_value_display()
            // apply styling settings
            this.htmlref.style.strokeWidth = '' + this.style.linewidth + 'px'
            this.htmlref.style.background = this.style.background
        },
        // add an entry to the list of entries
        push: function (entry) { this.entries.push(entry) },
        // list of horizontal markers to graph more readable, objects are of
        //   type graphmarker
        markers: [],
        // add a marker to the list of markers for this graph
        push_marker: function (marker) { this.markers.push(marker) },
        // remove all markers of the current graph object
        remove_markers: function () { this.markers = [] }
    }
}