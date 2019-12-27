
// graphentry object
// creates a new object representing an entry in a graph object
function graphentry (value) {
    return { value: value }
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
    htmlref = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
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
            w = $(this.htmlref).width()
            h = $(this.htmlref).height()
            d = 'M 0 ' + h + ' '
            d += 'L ' + (w - this.length() * this.entry_width) + ' ' + h + ' '
            // render lines
            htm = ''
            for (i = 0; i < this.length(); i++)
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
            for (i = 0; i < this.length(); i++)
                htm += '<circle cx="' + (w - this.entry_width * (this.length() - 
                       i - 1)) + '" cy="' + (h - (this.entries[i].value - min) /
                       (max - min) * h) + '" r="' + r + '" style="fill: ' +
                       this.style.linecolor + '" />'
            // render color under the graph line
            du = d + 'L ' + w + ' ' + h + ' Z'
            htm += '<path d="' + du + '" style="stroke: transparent; fill: ' +
                   this.style.undercolor + '" />'
            $(this.htmlref).html(htm)
            // apply styling settings
            this.htmlref.style.strokeWidth = '' + this.style.linewidth + 'px'
            this.htmlref.style.background = this.style.background
        },
        // add an entry to the list of entries
        push: function (entry) {
            this.entries.push(entry)
        }
    }
}

