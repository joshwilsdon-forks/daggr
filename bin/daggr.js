#!/usr/bin/env node

var mod_path = require('path');
var mod_extsprintf = require('extsprintf');
var mod_getopt = require('posix-getopt');
var mod_strsplit = require('strsplit');

var mod_daggr = require('../lib/daggr');

var sprintf = mod_extsprintf.sprintf;

var daArg0 = mod_path.basename(process.argv[1]);
var daUsage = sprintf([
    'usage: %s ACTION'
].join('\n'), daArg0);

function main()
{
	var parser, option;
	var keys = [];
	var value = '1';
	var action = 'print'
	var mode = 'text';
	var outputs = null;
	var filters = [];
	var source, stream, args, consumer;

	parser = new mod_getopt.BasicParser('f:jk:o:v:', process.argv);
	while ((option = parser.getopt()) !== undefined) {
		switch (option.option) {
		case 'k':
			keys.push(option.optarg);
			break;

		case 'f':
			filters.push(option.optarg);
			break;

		case 'j':
			mode = 'json'
			break;

		case 'o':
			if (outputs === null)
				outputs = [];
			outputs.push(option.optarg);
			break;

		case 'v':
			value = option.optarg;
			break;

		default:
			usage();
		}
	}

	if (process.argv.length > parser.optind())
		action = process.argv[parser.optind()];

	if (outputs === null)
		outputs = [ '0' ];

	source = process.stdin;
	stream = new mod_daggr.RowStream({
	    'mode': mode,
	    'stream': source
	});

	args = {
	    'mode': mode,
	    'action': action,
	    'key': keys,
            'value': value,
	    'stream': stream,
	    'outputs': outputs,
	    'outstream': process.stdout
	};

	filters.forEach(function (f) {
		try {
			stream = args['stream'] = 
			    new mod_daggr.FilterStream(args, f);
		} catch (err) {
			fatal('bad filter "' + f + '": ' + err.message);
		}
	});
	
	consumer = mod_daggr.createConsumer(action, args);

	if (consumer instanceof Error)
		fatal(consumer.message);

	process.stdin.resume();
}

function usage(message)
{
	if (arguments.length > 0)
		console.error('%s: %s', daArg0, message);
	console.error(daUsage);
	process.exit(2);
}

function fatal(message)
{
	console.error('%s: %s', daArg0, message);
	process.exit(1);
}

main();
