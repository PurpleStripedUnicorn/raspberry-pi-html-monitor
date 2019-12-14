
// this variable stores the history of received data via the 'update' function
data_history = {
    // where the actual history of data is stored
    history: [],
    // get the last received data
    last: function () {
        return this.history[this.history.length - 1]
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

// make from the given data a dataset object
function dataset (data) {
    return {
        data: data,
        // function to get a certain datapoint in the dataset with the given
        //   title
        get: function (title) {
            for (i = 0; i < this.data.length; i++)
                if (this.data[i].title == title)
                    return this.data[i]
        },
        // function to check if there is a datapoint in the dataset with the given
        //   title
        has: function (title) {
            for (i = 0; i < this.data.length; i++)
                if (this.data[i].title == title)
                    return true
            return false
        },
        // set a datapoint in the dataset with the given title to the given value,
        //   if there does not exist a datapoint with the given title, a new one
        //   is created and added to the list of datapoints
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

// get the data from the 'get.py' file and calculate and add some more entries
// e.g. the percentage of CPU usage since the last received data from this
//   function
// this function also stores the data (with extra entries) in the 'received'
//   variable
function update () {
    get(function (data) {
        ds = process_update(dataset(data))
        data_history.push(ds)
        update_fields(ds)
    }, function (jqXHR, textStatus, errorThrown) {

    })
}

// object with all of the transformation functions for displaying the data in a
//   dataset as strings
transforms = {
    // list of transformation functions
    // each function has a dataset as input, which it uses to find the data it
    //   needs to do the transform, it can also use completely different data
    //   from the datapoint requested
    list: [
        { title: 'cpu_usage_total', f: function (ds) {
            return '' + ds.get(this.title).value.toFixed(0) + '%' } }
    ],
    // get an entry from the list in this object with the given title
    get: function (title) {
        for (i = 0; i < this.list.length; i++)
            if (this.list[i].title == title)
                return list[i]
        console.error(`transform item with the name "` + title + `" cannot
            be found`)
    },
    // apply transform function to an item in the given dataset with the given
    //   title
    // return the transformed value
    transform: function (title, ds) {
        for (i = 0; i < this.list.length; i++)
            if (this.list[i].title == title)
                return this.list[i].f(ds)
    }
}

// update the fields with attributes like "data-out=xxx" with the desired data
function update_fields (ds) {
    $('[data-out]').each(function () {
        attr = $(this).attr('data-out')
        $(this).html(transforms.transform(attr, ds))
    })
}