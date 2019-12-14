
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