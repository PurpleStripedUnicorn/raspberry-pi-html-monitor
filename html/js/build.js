
// get a 'block' object returned from the information provided
// this is mainly to make including the html for a block easier
function block (title, statname, has_graph) {
    if (typeof has_graph == 'undefined')
        has_graph = false
    return {
        // the title displayed at the top of the block
        title: title,
        // the name identifying the statistic being measured
        statname: statname,
        has_graph: has_graph,
        // returns the html for the block
        html: function () {
            var htm = `
                <div class="block ` + (this.has_graph ? 'has_graph' : '') + `">
                    <h2 class="top">` + this.title + `</h2>
                    <div class="body">
                        <div class="big_stat">
                            <span data-out="` + this.statname + `"></span>
                        </div>
                    </div>
                </div>`
            if (this.has_graph)
                htm += `
                    <div class="block block_graph">
                        <h2 class="top">` + this.title + `</h2>
                        <div class="body">
                            <div class="graph" data-graph-out="`
                            + this.statname + `">
                            </div>
                        </div>
                    </div>`
            return htm
        }
    }
}

// build the 'blocks' part of the page
// these display all of the statistics and metrics of the pi
function build_blocks () {
    container = $('.blocks_container')
    // this variable contains all of the blocks that will be used
    blocks = [
        block('CPU usage', 'cpu_usage_total', true),
        block('RAM usage', 'ram_used', true),
        block('CPU temperature', 'temp_cpu', true),
        block('Rasberry Pi model', 'model'),
        block('Disk space free', 'disk_space_free'),
        block('Connection type', 'connection_type'),
        block('Time since last boot', 'time_boot_ago')
    ]
    for (i = 0; i < blocks.length; i++)
        container.append(blocks[i].html())
}

// object for an item in the top bar
function top_bar_item (text, action) {
    return {
        text: text,
        action: action,
        dom: function () {
            obj = document.createElement('div')
            obj.onclick = action
            obj.setAttribute('class', 'item')
            obj.innerText = text
            return obj
        }
    }
}

// build the 'top_bar' part of the page
// this the part where the user can change certain settings for the display of
//   the metrics
function build_top_bar () {
    var container = $('.top_bar')
    var items = [
        top_bar_item('Graphs', function () {
            $('.blocks_container').toggleClass('graphs_visible')
            // re-render the graphs because width/height changed
            for (var i = 0; i < graphs.length; i++)
                graphs[i].graph.render()
        })
    ]
    for (var i = 0; i < items.length; i++)
        container.append(items[i].dom())
}

// re-render all of the graphs when the width or height of the windows changes
$(window).on('resize', function () {
    for (var i = 0; i < graphs.length; i++)
        graphs[i].graph.render()
})

build_blocks()
build_top_bar()