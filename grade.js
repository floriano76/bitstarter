#!/usr/bin/env node

var fs = require('fs');
var program = require('commander');
var cheerio  = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
	if(!restlerUrl(instr)) {
	    console.log("%s does not exist. Exiting. ", instr);
	    process.exit(1); // http://node.js/api/process.html#process_process_exit_code
	}
    }
    return instr;
};

var restlerUrl = function(url) {
    return rest.get(url).on('complete', function(result) {
	if (result instanceof Error) {
	    return null;
	}
	return result;
    });
    
};

var cheerioHtmlFile = function(htmlfile) {
    if(fs.existsSync(htmlfile)) {
	htmlfile = fs.readFileSync(htmlfile);
    } else {
	htmlfile = restlerUrl(htmlfile)
    }
    return cheerio.load(htmlfile);
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
	var present = $(checks[ii]).length > 0;
	out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
	.option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
	.option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
	.option('-u, --url <url_path>', 'URL path', clone(assertFileExists))
	.parse(process.argv);
    if(program.url) {
	var checkJson = checkHtmlFile(program.url, program.checks);
    } else {
	var checkJson = checkHtmlFile(program.file, program.checks);
    }
    var outJson = JSON.stringify(checkJson, null, 4);
    fs.writeFileSync("checks.txt", outJson); 
    console.log(outJson);
} else {
    exports.checkHtmlFile = checkHtmlFile;
}


