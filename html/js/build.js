
// get a 'block' object returned from the information provided
// this is mainly to make including the html for a block easier
function block (title, statname) {
    return {
        // the title displayed at the top of the block
        title: title,
        // the name identifying the statistic being measured
        statname: statname,
        // returns the html for the block
        html: function () {
            return `<div class="block">
                        <h2 class="top">` + title + `</h2>
                        <div class="body">
                            <div class="big_stat">
                                <span data-out="` + statname + `"></span>
                            </div>
                        </div>
                    </div>`
        }
    }
}

// build the 'blocks' part of the page
// these display all of the statistics and metrics of the pi
function build_blocks () {
    container = $('.blocks_container')
    // this variable contains all of the blocks that will be used
    blocks = [
        block('CPU usage', 'cpu_usage_total'),
        block('RAM available', 'ram_available'),
        block('CPU temperature', 'temp_cpu'),
        block('Rasberry Pi model', 'model'),
        block('Disk space free', 'disk_space_free'),
        block('Connection type', 'connection_type')
    ]
    for (i = 0; i < blocks.length; i++)
        container.append(blocks[i].html())
}

build_blocks()