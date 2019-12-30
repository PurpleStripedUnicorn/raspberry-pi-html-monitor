
'use strict'

// check if a string is numeric
function isNumeric (n) {
    return !isNaN(parseFloat(n)) && isFinite(n)
}

// return the minimum of 2 numbers
function min (a, b) {
    return a > b ? b : a
}

// converts a number to a number with the added SI unit suffix representing
//   size
// e.g. to convert to byte size: units(98654, 'B') -> '98.7kB'
// the significance of the resulting number is always 3, unless other value is
//   given, if the significance of the number is lower than the number of digits
//   in the result, then the significance is ignored
function units (n, suffix, sig) {
    // list of all of the possible SI unit suffixes for the size
    var si_up = ['', 'k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y']
    var si_down = ['m', 'μ', 'n', 'p', 'f', 'a', 'z', 'y']
    // devide/multiply by 1000 until a number between 1 and 1000 is reached,
    //   this is the resulting number to put before the suffix
    var i = 0
    for (; n > 1000 && i + 1 < si_up.length; i++) n /= 1000
    for (; n != 0 && n < 1 && -i < si_down.length; i--) n *= 1000
    var unit = i < 0 ? si_down[-i - 1] : si_up[i]
    // determine the significance of the result
    var sig, digits
    if (typeof sig == 'undefined')
        sig = 3
    // make sure the significance of the number shown is always 3, unless
    //   instructed otherwise
    // first, determine the number of digits shown after the decimal dot
    digits = n > 100 ? min(0, sig-3) : n > 10 ? min(1, sig-2) : min(2, sig-1)
    if (digits < 0)
        digits = 0
    return n.toFixed(digits) + unit + suffix
}

// like units, converts a number to an easier to read number with a suffix
// this function converts a number of seconds to a string representing time
// e.g. units_time(100) -> '1m 40s'
function units_time (n) {
    // list all of the possible time scales with the amount of seconds they
    //   represent
    var count, c, out
    count = [['y', 31536000], ['d', 86400], ['h', 3600], ['m', 60], ['s', 1]]
    c = 0
    out = ''
    for (var i = 0; i < count.length; i++) {
        if (c < 2 && count[i][1] < n) {
            out += (String((n - n % count[i][1]) / count[i][1])
                + count[i][0] + ' ')
            n %= count[i][1]
            c++
        }
    }
    // remove the last trailing space
    return out.substring(0, out.length - 1)
}

// this variable stores the history of received data via the 'update' function
var data_history = {
    // where the actual history of data is stored
    history: [],
    // get the last received data, if a number is given, the nth last entry is
    //   returned
    last: function (n) {
        if (typeof n == 'undefined')
            n = 1
        return this.history[this.history.length - n]
    },
    // append a new dataset to the history
    push: function (ds) { this.history.push(ds) },
    length: function () { return this.history.length },
    isempty: function () { return this.length() == 0 }
}

// this variable stores the history of received data via the 'displayset'
//   function
var display_history = {
    // where the actual history is stored
    history: [],
    // append a new displayset to the history
    push: function (dps) { this.history.push(dps) },
    length: function () { return this.history.length },
    // return an array of values from the given datapoint title
    value_list: function (title) {
        var values = []
        for (var i = 0; i < this.history.length; i++)
            values.push(this.history[i].get(title).value)
        return values
    }
}

// get the data from the 'get.py' script by requesting the 'get/' page
// this data is automatically converted from JSON to a js object
// inputs are the success and error functions run when the request finishes
//   successfully and unsuccessfully respectively
function get (success, error) {
    if (typeof success == 'undefined')
        success = function () {}
    if (typeof error == 'undefined')
        error = function () {}
    $.ajax({ url: 'get/', method: 'get', success: success, error: error,
             dataType: 'json' })
}

// datapoint object, returned when using the dataset "get" method
function datapoint (dataset, title) {
    var value
    for (var i = 0; i < dataset.data.length; i++)
        if (dataset.data[i].title == title)
            value = dataset.data[i].value
    if (value == 'undefined')
        console.error('Cannot find object with title "' + title + '"')
    return {
        title: title,
        value: value
    }
}

// make from the given data a dataset object
function dataset (data) {
    return {
        data: data,
        // function to get a certain datapoint in the dataset with the given
        //   title
        get: function (title) { return datapoint(this, title) },
        // function to check if there is a datapoint in the dataset with the
        //   given title
        has: function (title) {
            for (var i = 0; i < this.data.length; i++)
                if (this.data[i].title == title)
                    return true
            return false
        },
        // set a datapoint in the dataset with the given title to the given
        //   value, if there does not exist a datapoint with the given title, a
        //   new one is created and added to the list of datapoints
        // returns the datapoint
        set: function (title, value) {
            for (var i = 0; i < this.data.length; i++)
                if (this.data[i].title == title) {
                    this.data[i].value = value
                    return obj.data[i]
                }
            this.data.push({ title: title, value: value })
            return this.get(title)
        }
    }
}

// processes the received data to calculate some new entries and returns the new
//   dataset
function process_update (ds) {
    // check if there is an dataset item of the last received data
    var prev
    if (!data_history.isempty())
        prev = data_history.last()
    else prev = false
    // add percentage of CPU usage since last received data
    var dx, dt
    if (prev) {
        dx = ds.get('cpu_times_total').value - prev.get('cpu_times_total').value
        dt = ds.get('timestamp').value - prev.get('timestamp').value
        ds.set('cpu_usage_total', dx / dt * 100)
    } else ds.set('cpu_usage_total', 0)
    return ds
}

// create a displayset object
// this object is used to update all of the fields with the desired formats of
//   the data
function displayset () {
    var cur = data_history.last(1)
    var has_last = data_history.length() >= 2
    var last
    if (data_history.length() >= 2)
        last = data_history.last(2)
    var data = []
    // CPU usage
    var tmp, time_diff, cpu_diff
    tmp = {
        title: 'cpu_usage_total',
        value: 0,
        displayvalue: function () { return units(this.value, '%', 0) },
        graph: function (parent) {
            var g = graph(parent, 100)
            g.style.value_text = true
            g.style.fontFamily = 'inherit'
            g.push_marker(graphmarker('25%', 25))
            g.push_marker(graphmarker('50%', 50))
            g.push_marker(graphmarker('75%', 75))
            return g
        }
    }
    if (has_last) {
        time_diff = cur.get('timestamp').value - last.get('timestamp').value
        cpu_diff = cur.get('cpu_times_total').value - 
            last.get('cpu_times_total').value
        tmp.value = cpu_diff / time_diff * 100 // 100 is for percentage
    }
    data.push(tmp)
    // calculate update frequency (if there have been at least 2 measurements)
    tmp = {
        title: 'update_freq',
        value: 0,
        displayvalue: function () { return units(this.value, 's') },
        graph: function (parent) {
            var g = graph(parent, 2)
            g.style.value_text = true
            g.style.fontFamily = 'inherit'
            g.push_marker(graphmarker('500ms', 0.5))
            g.push_marker(graphmarker('1000ms', 1))
            g.push_marker(graphmarker('1500ms', 1.5))
            return g
        }
    }
    if (has_last)
        tmp.value = cur.get('timestamp').value - last.get('timestamp').value
    data.push(tmp)
    // RAM availability/usage
    data.push({
        title: 'ram_total',
        value: cur.get('ram_total').value,
        displayvalue: function () { return units(this.value, 'B') }
    })
    data.push({
        title: 'ram_available',
        value: cur.get('ram_available').value,
        displayvalue: function () { return units(this.value, 'B') }
    })
    data.push({
        title: 'ram_used',
        value: cur.get('ram_used').value,
        displayvalue: function () { return units(this.value, 'B') },
        graph: function (parent) {
            var total = display_history.history[0].get('ram_total').value
            var g = graph(parent, total)
            g.style.value_text = true
            g.style.fontFamily = 'inherit'
            g.push_marker(graphmarker(units(total / 4, 'B'), total / 4))
            g.push_marker(graphmarker(units(total / 2, 'B'), total / 2))
            g.push_marker(graphmarker(units(total / 4 * 3, 'B'), total / 4 * 3))
            return g
        }
    })
    data.push({
        title: 'ram_free',
        value: cur.get('ram_free').value,
        displayvalue: function () { return units(this.value, 'B') }
    })
    data.push({
        title: 'ram_buffers',
        value: cur.get('ram_buffers').value,
        displayvalue: function () { return units(this.value, 'B') }
    })
    data.push({
        title: 'ram_cached',
        value: cur.get('ram_cached').value,
        displayvalue: function () { return units(this.value, 'B') }
    })
    data.push({
        title: 'ram_shared',
        value: cur.get('ram_shared').value,
        displayvalue: function () { return units(this.value, 'B') }
    })
    data.push({
        title: 'ram_slab',
        value: cur.get('ram_slab').value,
        displayvalue: function () { return units(this.value, 'B') }
    })
    // Connection type
    data.push({
        title: 'connection_wlan',
        value: cur.get('connection_wlan').value,
        displayvalue: function () { return this.value ? 'on' : 'off' }
    })
    data.push({
        title: 'connection_eth',
        value: cur.get('connection_eth').value,
        displayvalue: function () { return this.value ? 'on' : 'off' }
    })
    data.push({
        title: 'connection_type',
        value: cur.get('connection_wlan').value ? 'wlan' : (
            cur.get('connection_eth') ? 'ethernet' : 'off'),
        displayvalue: function () { return this.value }
    })
    // CPU temperature
    data.push({
        title: 'temp_cpu',
        value: cur.get('temp_cpu').value,
        displayvalue: function () { return units(this.value, '°C', 1) },
        graph: function (parent) {
            var g = graph(parent, 100)
            g.style.value_text = true
            g.style.fontFamily = 'inherit'
            g.push_marker(graphmarker('20°C', 20))
            g.push_marker(graphmarker('40°C', 40))
            g.push_marker(graphmarker('60°C', 60))
            g.push_marker(graphmarker('80°C', 80))
            return g
        }
    })
    // Raspberry Pi model
    data.push({
        title: 'model',
        value: cur.get('model').value,
        displayvalue: function () { return this.value }
    })
    // Disk space availability
    data.push({
        title: 'disk_space_total',
        value: cur.get('disk_space_total').value,
        displayvalue: function () { return units(this.value, 'B') }
    })
    data.push({
        title: 'disk_space_used',
        value: cur.get('disk_space_used').value,
        displayvalue: function () { return units(this.value, 'B') }
    })
    data.push({
        title: 'disk_space_free',
        value: cur.get('disk_space_free').value,
        displayvalue: function () { return units(this.value, 'B') }
    })
    data.push({
        title: 'disk_space_reserved',
        value: cur.get('disk_space_reserved').value,
        displayvalue: function () { return units(this.value, 'B') }
    })
    // Time since last startup of the pi
    data.push({
        title: 'time_boot_ago',
        value: cur.get('timestamp').value - cur.get('time_boot').value,
        displayvalue: function () { return units_time(this.value) }
    })
    return {
        data: data,
        // get an entry with the given title
        get: function (title) {
            for (var i = 0; i < this.data.length; i++)
                if (this.data[i].title == title)
                    return this.data[i]
            console.error('Could\'t find entry in displayset object with ' +
                          'title "' + title + '"')
        },
        update_fields: function () {
            var dps = this
            $('[data-out]').each(function () {
                update_field($(this), dps)
            })
        }
    }
}

// make the graphs variable global so it cn be used inside the update function
var graphs = null

// get the data from the 'get.py' file and calculate and add some more entries
// e.g. the percentage of CPU usage since the last received data from this
//   function
// this function also stores the data (with extra entries) in the 'received'
//   variable
function update () {
    get(function (data) {
        var ds = dataset(data)
        // add the current dataset to dataset history
        data_history.push(ds)
        // create new displayset object and update all of the fields with this
        // the displayset uses the global data_history variable
        var dps = displayset()
        display_history.push(dps)
        dps.update_fields()
        // if the graphs have not been associated with their respective html
        //   elements, associate them before updating these graphs
        if (graphs == null)
            graphs = associate_graphs()
        update_graphs(graphs, display_history)
        // set timer for next update
        setTimeout(update, 500)
    })
}
// run the update function as soon as the document is loaded
$(function () { update() })

// update a single field
// inputs are the object and the displayset to gather data from
function update_field (obj, dps) {
    $(obj).html(dps.get($(obj).attr('data-out')).displayvalue())
}

// find all html objects in the document with the attribute 'data-graph-out' and
//   create a graph object associated with them, returns an array of these graph
//   objects (with title-graph pairs as entries)
function associate_graphs () {
    var graphs = []
    var g, obj, attr
    $('[data-graph-out]').each(function () {
        obj = $(this)
        attr = obj.attr('data-graph-out')
        g = display_history.history[0].get(attr).graph(obj)
        graphs.push({
            title: attr,
            graph: g
        })
    })
    // return an array of the generated graphs, in the form of title-graph pairs
    return graphs
}

// update all graphs in the given array of title-graph pairs and the given
//   display_history object
function update_graphs (graphs, display_history) {
    var g, title, entries
    for (var i = 0; i < graphs.length; i++) {
        g = graphs[i].graph
        title = graphs[i].title
        entries = display_history.value_list(title)
        // limit to rendering only the last 100 entries
        while (entries.length > 100)
            entries.shift()
        for (var j = 0; j < entries.length; j++)
            entries[j] = graphentry(
                entries[j],
                display_history.history[j].get(title).displayvalue
            )
        g.entries = entries
        g.render()
    }
}