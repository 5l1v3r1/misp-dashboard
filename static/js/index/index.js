class Sources {
    constructor() {
        this._sourcesArray = {};
        this._sourcesCount = {};
        this._sourcesCountMax = {};
        this._globalMax = 0;
        this._sourceNames = [];
    }

    addSource(sourceName) {
        this._sourcesArray[sourceName] = [];
        this._sourcesCount[sourceName] = 0;
        this._sourcesCountMax[sourceName] = 0;
        this._sourceNames.push(sourceName);
    }

    addIfNotPresent(sourceName) {
        if (this._sourceNames.indexOf(sourceName) == -1) {
            this.addSource(sourceName);
        }
    }

    incCountOnSource(sourceName) {
        this._sourcesCount[sourceName] += 1;
    }

    resetCountOnSource() {
        for (var src of this._sourceNames) {
            this._sourcesCount[src] = 0;
        }
    }

    slideSource() {
        var globMax = 0;
        for (var src of this._sourceNames) {
            // res[0] = max, res[1] = slidedArray
            var res = slideAndMax(this._sourcesArray[src], this._sourcesCount[src]);
            // max
            this._sourcesCountMax[src] = res[0];
            globMax = globMax > res[0] ? globMax : res[0];
            // data
            this._sourcesArray[src] = res[1];
        }
        this._globalMax = globMax;
    }

    toArray() {
        var to_return = [];
        for (var src of this._sourceNames) {
            to_return.push({
                label: src,
                data: this._sourcesArray[src]
            });
        }
        return to_return;
    }

    getGlobalMax() {
        return this._globalMax;
    }

    getSingleSource(sourceName) {
        return this._sourcesArray[sourceName];
    }

    getEmptyData() {
        return [{label: 'no data', data: []}];
    }
}

/* END CLASS SOURCE */

var sources = new Sources();
sources.addSource('global');

var curNumLog = 0;
var curMaxDataNumLog = 0;

$(document).ready(function () {
    createHead(function() {
        if (!!window.EventSource) {
            var source_log = new EventSource(urlForLogs);

            source_log.onopen = function(){
                //console.log('connection is opened. '+source_log.readyState);  
            };

            source_log.onerror = function(){
                //console.log('error: '+source_log.readyState);  
            };

            source_log.onmessage = function(event) {
                var json = jQuery.parseJSON( event.data );
                updateLogTable(json.feedName, json.log);
            };
        
        } else {
            console.log("No event source_log");
        }
    });
});


//  LOG TABLE
function updateLogTable(feedName, log) {
    if (log.length == 0)
        return;

    // Create new row
    tableBody = document.getElementById('table_log_body');
    //curNumLog++;
    sources.addIfNotPresent(feedName);
    sources.incCountOnSource(feedName);
    sources.incCountOnSource('global');

    // only add row for attribute
    if (feedName == "Attribute" ) {
        createRow(tableBody, log);

        // Remove old row
        var logSel = document.getElementById("log_select");
        //get height of pannel, find max num of item
        var maxNumLogItem = document.getElementById('divLogTable').clientHeight/37;
        maxNumLogItem -= 2; //take heading/padding/... into account
        if (maxNumLogItem - parseInt(maxNumLogItem) < 0.5) { //beautifier
            maxNumLogItem -= 1;
        }
        if (tableBody.rows.length > maxNumLogItem) {
            while (tableBody.rows.length >= maxNumLogItem){
                tableBody.deleteRow(0);
            }
        }
    } else {
        // do nothing
        return;
    }
}

function slideAndMax(orig, newData) {
    var slided = [];
    var max = newData;
    for (i=1; i<orig.length; i++) {
        y = orig[i][1];
        slided.push([i-1, y]);
        max = y > max ? y : max;
    }
    slided.push([orig.length-1, newData]);
    curMaxDataNumLog = max;
    return [curMaxDataNumLog, slided];
}

function createRow(tableBody, log) {
    var tr = document.createElement('TR');
    //var action = document.createElement('TD');

    for (var key in log) {
        if (log.hasOwnProperty(key)) {
            var td = document.createElement('TD');
            td.appendChild(document.createTextNode(log[key]));
            tr.appendChild(td);
        }
    }

    // level
    if( log.level == "INFO" ){
        tr.className = "info";
    }
    else if ( log.level == "WARNING" ){
        tr.className = "warning";
    }
    else if ( log.level == "CRITICAL"){
        tr.className = "danger"
    }

    // action
    //action.appendChild(document.createTextNode("ACTION"));
    //tr.appendChild(action);

    tableBody.appendChild(tr);

}

function createHead(callback) {
    if (document.getElementById('table_log_head').childNodes.length > 1)
        return
    $.getJSON( urlForHead, function( data ) {
        var tr = document.createElement('TR');
        for (head of data) {
            var th = document.createElement('TH');
            th.appendChild(document.createTextNode(head));
            tr.appendChild(th);
        }
        //var action = document.createElement('TH');
        //action.appendChild(document.createTextNode("Actions"));
        //tr.appendChild(action);
        document.getElementById('table_log_head').appendChild(tr);
        callback();
    });
}