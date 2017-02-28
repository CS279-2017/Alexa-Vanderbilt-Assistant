
var fs = require('fs')
var filename = './data/' + 'mens baseball' + '.js';
var schedule = JSON.parse(fs.readFileSync(filename, 'utf8'));
var elem = schedule[0];
//console.log(schedule);

console.log(elem['time']);
if(elem['time'].includes("W") || elem['time'].includes("L")){
	console.log("ITS A WIN/LOSS");
}