#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('../../market-research/node_modules/restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var URL_DEFAULT = "http://desolate-shore-1453.herokuapp.com";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
	console.log("%s does not exist. Exiting.", instr);
	process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var getHtmlFromUrl = function(url) {
    console.log("calling getHtmlFromUrl");
    rest.get(url).on('complete', function(result) {
	fs.writeFile('downloaded-url.html', result, function(err) {
	     if (err) {
		 throw err;
		 console.log('error writing file');
             }
                 console.log('successfully saved');
	});
	for (i = 1; i<100000; i++) {}
    });
};


var checkHtmlFile = function(htmlfile, checksfile) {
    console.log("first 4 chars of htmlfile: " + htmlfile.substring(0,4));
    if (htmlfile.substring(0,4) == "http") {
       htmlfile = 'downloaded-url.html';
    }
    console.log("html file: " + htmlfile);
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
	.option('-f, --file <html_file>', 'Path to index.html')
	.option('-u, --url <url>', 'URL to index.html')
	.parse(process.argv);
    console.log(program.file);
    console.log(program.url);
    var src = '';
    if ((typeof program.file != 'undefined') && program.file.length > 0) {
	src = program.file;
    } else if (program.url.length > 0) {
	src = program.url;
	getHtmlFromUrl(src);
    } else {
	process.exit(1);
    }
    console.log('src: ' + src);
    var checkJson = checkHtmlFile(src, program.checks);
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
