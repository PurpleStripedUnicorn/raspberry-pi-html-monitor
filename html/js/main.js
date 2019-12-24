
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
    si_up = ['', 'k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y']
    si_down = ['m', 'μ', 'n', 'p', 'f', 'a', 'z', 'y']
    // devide/multiply by 1000 until a number between 1 and 1000 is reached,
    //   this is the resulting number to put before the suffix
    i = 0
    for (; n > 1000 && i + 1 < si_up.length; i++) n /= 1000
    for (; n != 0 && n < 1 && -i < si_down.length; i--) n *= 1000
    unit = i < 0 ? si_down[-i - 1] : si_up[i]
    // determine the significance of the result
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
    count = [['y', 31536000], ['d', 86400], ['h', 3600], ['m', 60], ['s', 1]]
    c = 0
    out = ''
    for (i = 0; i < count.length; i++) {
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
data_history = {
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
    for (i = 0; i < dataset.data.length; i++)
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
            for (i = 0; i < this.data.length; i++)
                if (this.data[i].title == title)
                    return true
            return false
        },
        // set a datapoint in the dataset with the given title to the given
        //   value, if there does not exist a datapoint with the given title, a
        //   new one is created and added to the list of datapoints
        // returns the datapoint
        set: function (title, value) {
            for (i = 0; i < this.data.length; i++)
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
    if (!data_history.isempty())
        prev = data_history.last()
    else prev = false
    // add percentage of CPU usage since last received data
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
    cur = data_history.last(1)
    has_last = data_history.length() >= 2
    if (data_history.length() >= 2)
        last = data_history.last(2)
    data = []
    // CPU usage
    tmp = {
        title: 'cpu_usage_total',
        value: 0,
        displayvalue: function () { return units(this.value, '%', 0) }
    }
    if (has_last) {
        time_diff = cur.get('timestamp').value - last.get('timestamp').value
        cpu_diff = cur.get('cpu_times_total').value - 
            last.get('cpu_times_total').value
        tmp.value = cpu_diff / time_diff * 100 // 100 is for percentage
    }
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
        displayvalue: function () { return units(this.value, 'B') }
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
    // CPU temperature
    data.push({
        title: 'temp_cpu',
        value: cur.get('temp_cpu').value,
        displayvalue: function () { return units(this.value, '°C', 1) }
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
    return {
        data: data,
        // get an try with the given title
        get: function (title) {
            for (i = 0; i < this.data.length; i++)
                if (this.data[i].title == title)
                    return this.data[i]
            console.error('Could\'t find entry in displayset object with ' +
                          'title "' + title + '"')
        },
        update_fields: function () {
            dps = this
            $('[data-out]').each(function () {
                update_field($(this), dps)
            })
        }
    }
}

// get the data from the 'get.py' file and calculate and add some more entries
// e.g. the percentage of CPU usage since the last received data from this
//   function
// this function also stores the data (with extra entries) in the 'received'
//   variable
function update () {
    get(function (data) {
        ds = dataset(data)
        // add the current dataset to dataset history
        data_history.push(ds)
        // create new displayset object and update all of the fields with this
        // the displayset uses the global data_history variable
        dps = displayset()
        dps.update_fields()
        // set timer for next update
        setTimeout(update, 500)
    }, function (jqXHR, textStatus, errorThrown) {

    })
}
// run the update function as soon as the document is loaded
$(function () { update() })

// object with all of the transformation functions for displaying the data in a
//   dataset as strings
transforms = {
    // list of transformation functions
    // input of all of the functions is the title requested and the current 
    //   dataset
    fn: {
        // return data as a string representing a size in bytes
        datasize: function (title, ds) {
            return units(ds.get(title).value, 'B')
        },
        // return a percentage, used for CPU usage measurements
        cpu: function (title, ds) {
            return '' + ds.get(title).value.toFixed(0) + '%'
        },
        // identity function, just returns value associated to the given title
        id: function (title, ds) {
            return '' + ds.get(title).value // turns data into string
        },
        // return data as a string representing temperature
        temp: function (title, ds) {
            return units(ds.get(title).value, '°C', 2)
        },
        // returns data 'on' when boolean true and 'off' otherwise, this is used
        //   for the connection measurement
        connection: function (title, ds) {
            return ds.get(title).value ? 'on' : 'off'
        }
    },
    // list of (references to) transformation functions
    // these are bridges between the title given and the transformation
    //   functions that are defined
    list: [
        // CPU transform functions
        { title: 'cpu_usage_total', fn: 'cpu' },
        // RAM transform functions
        { title: 'ram_total', fn: 'datasize' },
        { title: 'ram_available', fn: 'datasize' },
        { title: 'ram_used', fn: 'datasize' },
        { title: 'ram_free', fn: 'datasize' },
        { title: 'ram_buffers', fn: 'datasize' },
        { title: 'ram_cached', fn: 'datasize' },
        { title: 'ram_shared', fn: 'datasize' },
        { title: 'ram_slab', fn: 'datasize' },
        // Hardware transform functions
        { title: 'model', fn: 'id' },
        // Temperature transform functions
        { title: 'temp_cpu', fn: 'temp' },
        // Connection transform functions
        { title: 'connection_wlan', fn: 'connection' },
        { title: 'connection_eth', fn: 'connection' },
        // Disk usage transform functions
        { title: 'disk_space_total', fn: 'datasize' },
        { title: 'disk_space_used', fn: 'datasize' },
        { title: 'disk_space_free', fn: 'datasize' },
        { title: 'disk_space_reserved', fn: 'datasize' }
    ],
    // get an entry from the list in this object with the given title
    get: function (title) {
        for (i = 0; i < this.list.length; i++)
            if (this.list[i].title == title)
                return list[i]
        console.error(`transform item with the name "` + title + `" cannot `
            + `be found`)
    },
    // apply transform function to an item in the given dataset with the given
    //   title
    // return the transformed value
    transform: function (title, ds) {
        for (i = 0; i < this.list.length; i++)
            if (this.list[i].title == title)
                return this.fn[this.list[i].fn](title, ds)
        console.error(`transform item with the name "` + title + `" cannot `
            + `be found`)
    }
}

// update a single field
// inputs are the object and the displayset to gather data from
function update_field (obj, dps) {
    $(obj).html(dps.get($(obj).attr('data-out')).displayvalue())
}