const dialog = require("electron").remote.dialog;
const process = require("child_process");

var parentChart;
var chart;
var backgroundSliceStack = [];

function setup() {
	var enlistmentRoot = runFilePicker();
	console.log(enlistmentRoot);

	var command = "gvfs health " + enlistmentRoot;
	process.exec(command, (error, stdout, stderr) => {
		if (error) {
			console.error(`exec error: ${error}`);
			return;
		}
		console.log(`stdout: ${stdout}`);
		console.log(`stderr: ${stderr}`);
	});

	createCanvas(windowWidth, windowHeight);
	background(255);

	var dirA = new DirectoryInfo("A", 10, 5);
	var dirB = new DirectoryInfo("B", 10, 7);
	var dirC = new DirectoryInfo("C", 50, 10);
	var dirD = new DirectoryInfo("D", 25, 14);
	var dirE = new DirectoryInfo("E", 15, 12);

	var directories = [dirA, dirB, dirC, dirD, dirE];

	var dir1 = new DirectoryInfo("1", 15, 5);
	var dir2 = new DirectoryInfo("2", 10, 10);
	var dir3 = new DirectoryInfo("3", 5, 3);

	var dirDChildren = [dir1, dir2, dir3];

	var slices = [];

	var lastAngle = 0;
	var newAngle;
	for (var i = 0; i < directories.length; i++) {
		newAngle = directories[i].totalFiles * 2 * Math.PI / 110;
		slices.push(new ChartSlice(lastAngle, lastAngle + newAngle, DEFAULT_RADIUS, directories[i].dirName));
		let hydrationPercentage = directories[i].hydratedFiles / directories[i].totalFiles;
		slices[i].color = hydrationColorPicker(hydrationPercentage);
		lastAngle += newAngle;
	}

	var childSlices = [];
	
	lastAngle = 0;
	for (i = 0; i < dirDChildren.length; i++) {
		newAngle = dirDChildren[i].totalFiles * 2 * Math.PI / 30;
		childSlices.push(new ChartSlice(lastAngle, lastAngle + newAngle, DEFAULT_RADIUS, dirDChildren[i].dirName));
		childSlices[i].radius = 0;
		let hydrationPercentage = dirDChildren[i].hydratedFiles / dirDChildren[i].totalFiles;
		childSlices[i].color = hydrationColorPicker(hydrationPercentage);
		lastAngle += newAngle;
	}

	slices[3].childChart = new PieChart(childSlices);
	slices[3].childChart.parentSlice = slices[3];

	chart = new PieChart(slices);
	chart.visible = true;
	parentChart = chart;
}

function draw() {
	background(255);
	hover(mouseX, mouseY);
	for (var i = 0; i < backgroundSliceStack.length; i++) {
		backgroundSliceStack[i].draw();
	}
	chart.draw();
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