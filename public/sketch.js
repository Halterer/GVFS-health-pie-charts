const dialog = require("electron").remote.dialog;
const process = require("child_process");

var parentChart;
var chart;
var backgroundSliceStack = [];
var enlistmentRoot;

var textGraphics;

function setup() {
	enlistmentRoot = runFilePicker();
	console.log(enlistmentRoot);

	createCanvas(windowWidth, windowHeight);
	background(255);

	chart = getHealthData();
	chart.visible = true;
	parentChart = chart;
}

function draw() {
	background(255);
	if (textGraphics) {
		textGraphics.remove();
	}
	textGraphics = createGraphics(windowWidth, windowHeight);
	hover(mouseX, mouseY);
	for (var i = 0; i < backgroundSliceStack.length; i++) {
		backgroundSliceStack[i].draw();
	}
	chart.draw();
	image(textGraphics, 0, 0);
}

function mouseClicked() {
	chart = chart.handleClick(mouseX, mouseY);
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
}

function DirectoryInfo(dirName, totalFiles, hydratedFiles) {
	this.dirName = dirName;
	this.totalFiles = totalFiles;
	this.hydratedFiles = hydratedFiles;
}

function hover(x, y) {
	chart.hoverSlice(x, y);
}

function addBackgroundSlice(slice) {
	backgroundSliceStack.push(slice);
	slice.zoomIn();
}

function removeBackgroundSlice() {
	if (backgroundSliceStack.length > 0) {
		backgroundSliceStack.pop().zoomOut();
	}
}

function runFilePicker() {
	return dialog.showOpenDialog({
		title: "Open VFS For Git Enlisment Root",
		properties: ["openDirectory"]
	})[0];
}

function hydrationColorPicker (hydration) {
	let red = min(hydration * 2, 1) * 255;
	let green = min(2 * (1 - hydration), 1) * 255;
	let blue = 0;
	return color(red, green, blue);
}

function getHealthData(directory = null) {
	let command;
	if (directory == null) {
		command = "gvfs health " + enlistmentRoot;	
	} else {
		command = "gvfs health -d " + directory + " " + enlistmentRoot; 
	}

	healthOutput = process.execSync(command).toString();
	let healthOutputLines = healthOutput.split('\n').filter((line) => { return line != ""; });
	console.log(healthOutputLines);

	let totalFileInfoRegEx = /Total files in HEAD commit:\s*([\d,]+)\s*\|\s*(\d+)%/;
	let fastFileInfoRegEx = /Files managed by VFS for Git \(fast\):\s*([\d,]+)\s*\|\s*(\d+)%/;
	let slowFileInfoRegEx = /Files managed by Git:\s*([\d,]+)\s*\|\s*(\d+)%/;
	let subDirectoryInfoRegEx = /\s*([\d,]+)\s*\/\s*([\d,]+)\s*\|\s*(\S.*\S)\s*/;

	let totalReportedFiles, reportedFastFiles, reportedSlowFiles;
	let directoryInfos = [];

	[ , totalReportedFiles] = healthOutputLines[2].match(totalFileInfoRegEx);
	[ , reportedFastFiles] = healthOutputLines[3].match(fastFileInfoRegEx);
	[ , reportedSlowFiles] = healthOutputLines[4].match(slowFileInfoRegEx);

	for (let i = 0; i < healthOutputLines.length - 8; i++) {
		let dirHydrationCount, dirFileCount, dirName;
		[ , dirHydrationCount, dirFileCount, dirName] = healthOutputLines[7 + i].match(subDirectoryInfoRegEx);
		directoryInfos.push(new DirectoryInfo(dirName, dirFileCount, dirHydrationCount));
	}

	return pieChartFromDirectoryInfo(directoryInfos, reportedFastFiles + reportedSlowFiles, totalReportedFiles);
}

function pieChartFromDirectoryInfo(directoryInfos, totalHydratedFiles, totalFiles) {
	let lastAngle = 0;
	let newAngle;
	let slices = [];
	let accountedHydration = 0;

	for (let i = 0; i < directoryInfos.length; i++) {
		newAngle = directoryInfos[i].totalFiles * 2 * Math.PI / totalFiles;
		slices.push(new ChartSlice(lastAngle, lastAngle + newAngle, DEFAULT_RADIUS, directoryInfos[i].dirName));
		let hydrationPercentage = directoryInfos[i].hydratedFiles / directoryInfos[i].totalFiles;
		accountedHydration += directoryInfos[i].hydratedFiles;
		slices[i].color = hydrationColorPicker(hydrationPercentage);
		lastAngle += newAngle;
	}

	slices.push(new ChartSlice(lastAngle, 2 * Math.PI, DEFAULT_RADIUS, "Other directories"));
	slices[slices.length - 1].color = hydrationColorPicker((totalHydratedFiles - accountedHydration) / totalFiles);

	return new PieChart(slices);
}