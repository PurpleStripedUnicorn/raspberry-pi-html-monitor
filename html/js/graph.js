
// graphentry object
// creates a new object representing an entry in a graph object
function graphentry (value) {
    return { value: value }
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
    return {
        // stores all of the entries of the graph, from left to right, in the 
        //   format of the graphentry object
        entries: [],
        // amount of space to leave between entries in the graph (in px)
        entry_width: 10,
        style: { // default values
            linewidth: 3,
            dots: false,
            linecolor: 'rgb(139, 140, 224)',
            undercolor: 'rgba(139, 140, 224, 0.3)',
            background: '#f3f3f3'
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
        // render the graph in the htmlref SVG object, using the entries stored
        //   in this object
        render: function () {
            var w, h, d, htm, r, du
            w = $(this.htmlref).width()
            h = $(this.htmlref).height()
            d = 'M 0 ' + h + ' '
            d += 'L ' + (w - this.length() * this.entry_width) + ' ' + h + ' '
            // render lines
            htm = ''
            for (var i = 0; i < this.length(); i++)
                d += 'L ' + (w - this.entry_width * (this.length() - i - 1)) + 
                     ' ' + (h - (this.entries[i].value - min) / (max - min) * h) 
                     + ' '
            htm += '<path d="' + d + '" style="stroke: ' + this.style.linecolor
                   + '; stroke-width: ' + this.style.linewidth 
                   + '; fill: none" />'
            // render circles to make lines smoother
            r = this.style.linewidth * 0.5
            if (this.style.dots)
                r *= 2
            for (var i = 0; i < this.length(); i++)
                htm += '<circle cx="' + (w - this.entry_width * (this.length() - 
                       i - 1)) + '" cy="' + (h - (this.entries[i].value - min) /
                       (max - min) * h) + '" r="' + r + '" style="fill: ' +
                       this.style.linecolor + '" />'
            // render color under the graph line
            du = d + 'L ' + w + ' ' + h + ' Z'
            htm += '<path d="' + du + '" style="stroke: transparent; fill: ' +
                   this.style.undercolor + '" />'
            // render horizontal markers
            var hloc
            for (var i = 0; i < this.markers.length; i++) {
                // calculate the y location of the line
                hloc = this.markers[i].value / max * h
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
            $(this.htmlref).html(htm)
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

// find all html objects in the document with the attribute 'data-graph-out' and
//   create a graph object associated with them, returns an array of these graph
//   objects (with title-graph pairs as entries)
function associate_graphs () {
    var graphs = []
    var g
    $('[data-graph-out]').each(function () {
        var obj = $(this)
        var attr = obj.attr('data-graph-out')
        switch (attr) {
            // cpu usage graph
            case 'cpu_usage_total':
                g = graph(obj, 100, 0)
                g.push_marker(graphmarker('25%', 25))
                g.push_marker(graphmarker('50%', 50))
                g.push_marker(graphmarker('75%', 75))
                graphs.push({
                    title: 'cpu_usage_total',
                    graph: g
                })
                break
            // if there is no support for the requested graph, throw an error
            default:
                console.error('graph type "' + attr + '" cannot be found')
                break
        }
    })
    // return an array of the generated graphs, in the form of title-graph pairs
    return graphs
}

// update all graphs in the given array of title-graph pairs and the given
//   display_history object
function update_graphs (graphs, display_history) {
    var g, title, entries
    for (i = 0; i < graphs.length; i++) {
        g = graphs[i].graph
        title = graphs[i].title
        entries = display_history.value_list(title)
        // limit to rendering only the last 100 entries
        while (entries.length > 100)
            entries.shift()
        for (var i = 0; i < entries.length; i++)
            entries[i] = graphentry(entries[i])
        g.entries = entries
        g.render()
    }
}

